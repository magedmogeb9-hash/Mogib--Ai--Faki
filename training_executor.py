"""
خدمة تنفيذ التدريب الفعلي
تستخدم مكتبات Hugging Face مفتوحة المصدر بالكامل (transformers, peft, datasets)
لا تتطلب أي مفتاح API مدفوع - التدريب يعمل محليًا على عتاد المستخدم (GPU/CPU)
"""
from typing import Any, Optional
import os
import json
from datetime import datetime
from app.core.config import settings


def run_local_finetune_job(
    job_id: str,
    base_model_id: str,
    dataset_path: str,
    output_dir: str,
    hyperparameters: dict[str, Any],
    progress_callback: Optional[Any] = None,
) -> dict[str, Any]:
    """
    ينفذ عملية ضبط دقيق (fine-tuning) محلية كاملة باستخدام مكتبات مفتوحة المصدر.
    يُستدعى هذا داخل مهمة Celery خلفية (انظر app/services/celery_tasks.py)

    ملاحظة: هذه الدالة مصممة للعمل دون أي مفتاح API تجاري. تعتمد فقط على:
    - transformers (مفتوح المصدر، Apache 2.0)
    - peft لتدريب LoRA الخفيف (يقلل الحاجة لعتاد ضخم)
    - datasets لتحميل/معالجة البيانات (من المستخدم أو من Hugging Face Hub العام)
    """
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling,
    )
    from datasets import load_dataset
    from peft import LoraConfig, get_peft_model, TaskType

    os.makedirs(output_dir, exist_ok=True)
    log_path = os.path.join(output_dir, "training.log")

    def log(message: str):
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.utcnow().isoformat()}] {message}\n")

    log(f"بدء التدريب - النموذج الأساسي: {base_model_id}")

    # تحميل التوكنايزر والنموذج (مفتوحا المصدر من Hugging Face Hub)
    tokenizer = AutoTokenizer.from_pretrained(
        base_model_id, cache_dir=settings.MODELS_CACHE_DIR
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model_id, cache_dir=settings.MODELS_CACHE_DIR
    )

    # تطبيق LoRA لتقليل استهلاك الذاكرة (تدريب خفيف يعمل حتى على GPU محدود)
    if hyperparameters.get("use_lora", True):
        lora_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=hyperparameters.get("lora_rank", 8),
            lora_alpha=16,
            lora_dropout=0.05,
        )
        model = get_peft_model(model, lora_config)
        log("تم تطبيق LoRA لتدريب خفيف الموارد")

    # تحميل البيانات - يدعم ملفات محلية (csv/json/txt) أو مجموعات من Hugging Face Hub
    if dataset_path.startswith("hf://"):
        dataset = load_dataset(dataset_path.replace("hf://", ""))
    else:
        ext = dataset_path.split(".")[-1]
        dataset = load_dataset(ext, data_files=dataset_path)

    def tokenize_function(examples):
        text_field = "text" if "text" in examples else list(examples.keys())[0]
        return tokenizer(
            examples[text_field],
            truncation=True,
            max_length=hyperparameters.get("max_seq_length", 512),
            padding="max_length",
        )

    tokenized_dataset = dataset.map(tokenize_function, batched=True)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=hyperparameters.get("num_epochs", 3),
        per_device_train_batch_size=hyperparameters.get("batch_size", 8),
        gradient_accumulation_steps=hyperparameters.get("gradient_accumulation_steps", 1),
        learning_rate=hyperparameters.get("learning_rate", 2e-5),
        warmup_ratio=hyperparameters.get("warmup_ratio", 0.03),
        logging_dir=os.path.join(output_dir, "logs"),
        logging_steps=10,
        save_strategy="epoch",
        report_to=[],
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"] if "train" in tokenized_dataset else tokenized_dataset,
        data_collator=data_collator,
    )

    log("بدء حلقة التدريب...")
    train_result = trainer.train()
    log(f"انتهى التدريب. الخسارة النهائية: {train_result.training_loss}")

    # حفظ النموذج المدرّب بصيغة قابلة للتحميل والمشاركة
    final_model_path = os.path.join(output_dir, "final_model")
    trainer.save_model(final_model_path)
    tokenizer.save_pretrained(final_model_path)
    log(f"تم حفظ النموذج النهائي في: {final_model_path}")

    metrics = {
        "training_loss": train_result.training_loss,
        "global_step": train_result.global_step,
        "model_output_path": final_model_path,
    }

    with open(os.path.join(output_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    return metrics


def package_model_for_download(model_dir: str, output_zip_path: str) -> str:
    """تجميع ملفات النموذج المدرّب في أرشيف ZIP واحد قابل للتحميل"""
    import shutil

    archive_base = output_zip_path.replace(".zip", "")
    shutil.make_archive(archive_base, "zip", model_dir)
    return f"{archive_base}.zip"
