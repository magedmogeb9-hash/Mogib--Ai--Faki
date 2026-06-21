"""
خدمة التخطيط الذكي للتدريب
تستخدم نموذج لغوي (مفتاح المستخدم الخاص إن توفر، أو قواعد محلية كخيار احتياطي)
لتوليد خطة تدريب مفصّلة بناءً على وصف الهدف
"""
from typing import Optional, Any
import json
from app.core.config import settings


# قاعدة معرفية محلية لا تحتاج أي مفتاح API - تعمل دائمًا كخيار أساسي مجاني
LOCAL_KNOWLEDGE_BASE = {
    "text_classification": {
        "recommended_base_models": [
            "distilbert-base-multilingual-cased",
            "aubmindlab/bert-base-arabertv2",
            "xlm-roberta-base",
        ],
        "approach": "fine_tune",
        "min_dataset_size": 500,
        "estimated_gpu_hours": {"small": 1, "medium": 4, "large": 12},
    },
    "text_generation": {
        "recommended_base_models": [
            "meta-llama/Llama-3.1-8B",
            "Qwen/Qwen2.5-7B",
            "mistralai/Mistral-7B-v0.3",
        ],
        "approach": "lora_peft",
        "min_dataset_size": 1000,
        "estimated_gpu_hours": {"small": 6, "medium": 24, "large": 72},
    },
    "embeddings_rag": {
        "recommended_base_models": [
            "intfloat/multilingual-e5-large",
            "BAAI/bge-m3",
        ],
        "approach": "rag_pipeline",
        "min_dataset_size": 200,
        "estimated_gpu_hours": {"small": 0.5, "medium": 2, "large": 6},
    },
    "speech": {
        "recommended_base_models": [
            "openai/whisper-large-v3",
            "facebook/seamless-m4t-v2-large",
        ],
        "approach": "fine_tune",
        "min_dataset_size": 2000,
        "estimated_gpu_hours": {"small": 10, "medium": 40, "large": 120},
    },
}


def _classify_goal(goal_description: str) -> str:
    """تصنيف بسيط للهدف بالكلمات المفتاحية - بديل محلي مجاني عن استدعاء LLM"""
    text = goal_description.lower()
    if any(k in text for k in ["تصنيف", "classification", "تمييز", "فرز"]):
        return "text_classification"
    if any(k in text for k in ["صوت", "speech", "تفريغ", "نسخ صوتي", "whisper"]):
        return "speech"
    if any(k in text for k in ["بحث", "استرجاع", "rag", "embedding", "تشابه"]):
        return "embeddings_rag"
    return "text_generation"


def generate_training_plan_local(
    goal_description: str,
    dataset_description: Optional[str] = None,
    available_gpu: Optional[str] = None,
    budget_usd: Optional[float] = None,
) -> dict[str, Any]:
    """
    توليد خطة تدريب باستخدام القاعدة المعرفية المحلية فقط
    (لا يتطلب أي مفتاح API مدفوع - يعمل دائمًا كخط أساس مجاني)
    """
    category = _classify_goal(goal_description)
    kb = LOCAL_KNOWLEDGE_BASE[category]

    gpu_tier = "small"
    if available_gpu:
        gpu_lower = available_gpu.lower()
        if any(g in gpu_lower for g in ["a100", "h100", "a6000"]):
            gpu_tier = "large"
        elif any(g in gpu_lower for g in ["4090", "3090", "v100", "a4000"]):
            gpu_tier = "medium"

    plan = {
        "category": category,
        "approach": kb["approach"],
        "recommended_base_models": kb["recommended_base_models"],
        "minimum_recommended_dataset_size": kb["min_dataset_size"],
        "estimated_gpu_hours": kb["estimated_gpu_hours"][gpu_tier],
        "steps": [
            {
                "order": 1,
                "title": "تجهيز وتنظيف البيانات",
                "details": "إزالة التكرار، توحيد التنسيق، تقسيم train/validation/test بنسبة 80/10/10",
            },
            {
                "order": 2,
                "title": "اختيار النموذج الأساسي",
                "details": f"يُنصح بالبدء بـ {kb['recommended_base_models'][0]} لتوازنه بين الأداء والتكلفة",
            },
            {
                "order": 3,
                "title": "إعداد بيئة التدريب",
                "details": "تثبيت transformers و peft و accelerate، وتفعيل التدريب على GPU إن وُجد",
            },
            {
                "order": 4,
                "title": "التدريب الأولي (Baseline)",
                "details": "تشغيل تدريب قصير (epoch واحد) للتحقق من سلامة الأنابيب (pipeline) قبل التدريب الكامل",
            },
            {
                "order": 5,
                "title": "التدريب الكامل وضبط المعاملات",
                "details": "تجربة عدة قيم لـ learning_rate و batch_size، ومراقبة منحنى الخسارة (loss)",
            },
            {
                "order": 6,
                "title": "التقييم والاختبار",
                "details": "تقييم النموذج على بيانات لم يرها أثناء التدريب، وقياس المقاييس المناسبة للمهمة",
            },
            {
                "order": 7,
                "title": "التصدير والنشر",
                "details": "تصدير النموذج بصيغة قابلة للتحميل (safetensors/GGUF) ورفع المشروع إلى GitHub",
            },
        ],
        "estimated_cost_usd": _estimate_cost(gpu_tier, kb["estimated_gpu_hours"][gpu_tier]),
        "notes": "هذه الخطة مولّدة محليًا دون استخدام أي مفتاح API مدفوع. للحصول على تخطيط أكثر تخصيصًا، يمكن ربط مفتاح Anthropic أو OpenAI الخاص بك من صفحة الإعدادات.",
    }

    if budget_usd is not None and plan["estimated_cost_usd"] > budget_usd:
        plan["budget_warning"] = (
            f"التكلفة المقدرة (${plan['estimated_cost_usd']}) تتجاوز الميزانية المحددة "
            f"(${budget_usd}). يُنصح باستخدام LoRA/PEFT لتقليل التكلفة أو تقليص حجم البيانات."
        )

    return plan


def _estimate_cost(gpu_tier: str, gpu_hours: float) -> float:
    """تقدير تكلفة تقريبية بالدولار حسب فئة الـ GPU (أسعار سحابية تقريبية للتوجيه فقط)"""
    hourly_rates = {"small": 0.5, "medium": 2.0, "large": 4.5}
    return round(hourly_rates[gpu_tier] * gpu_hours, 2)


async def generate_training_plan_with_llm(
    goal_description: str,
    user_anthropic_key: Optional[str] = None,
    dataset_description: Optional[str] = None,
    available_gpu: Optional[str] = None,
    budget_usd: Optional[float] = None,
) -> dict[str, Any]:
    """
    توليد خطة تدريب أكثر تخصيصًا عبر استدعاء Claude API
    يُستخدم فقط إذا زوّد المستخدم مفتاحه الخاص (لا يوجد مفتاح مجاني مدفوع من المنصة)
    """
    base_plan = generate_training_plan_local(
        goal_description, dataset_description, available_gpu, budget_usd
    )

    if not user_anthropic_key:
        return base_plan

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=user_anthropic_key)
        prompt = f"""بصفتك خبير هندسة تعلم الآلة، حسّن خطة التدريب التالية بناءً على الهدف المحدد.
الهدف: {goal_description}
وصف البيانات: {dataset_description or 'غير محدد'}
الخطة الأساسية: {json.dumps(base_plan, ensure_ascii=False)}

أرجع فقط JSON محدّث بنفس البنية مع تحسينات دقيقة، بدون أي نص إضافي."""

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text_response = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )
        enhanced_plan = json.loads(text_response)
        return enhanced_plan
    except Exception:
        # عند أي فشل (مفتاح غير صالح، خطأ شبكة...) نعود للخطة المحلية المجانية
        return base_plan
