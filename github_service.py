"""
خدمة رفع المشاريع تلقائيًا إلى GitHub
تستخدم توكن المستخدم الخاص (Personal Access Token أو OAuth) - لا حاجة لمفتاح من المنصة
"""
from typing import Any
import os
import base64
from github import Github, GithubException


def get_or_create_repo(github_client: Github, repo_name: str, private: bool = True):
    """يبحث عن مستودع بالاسم المحدد، أو يُنشئ مستودعًا جديدًا إن لم يوجد"""
    user = github_client.get_user()
    try:
        repo = user.get_repo(repo_name)
        return repo
    except GithubException:
        repo = user.create_repo(
            name=repo_name,
            private=private,
            description="مشروع تدريب نموذج ذكاء اصطناعي - تم إنشاؤه عبر AI Training Orchestrator Platform",
            auto_init=True,
        )
        return repo


def push_project_files(project: Any, github_token: str, repo_name: str) -> dict[str, str]:
    """
    يرفع كل ملفات المشروع (الكود، خطة التدريب، ملفات README، النموذج الناتج إن كان صغيرًا)
    إلى مستودع GitHub باستخدام توكن المستخدم الخاص فقط.
    """
    client = Github(github_token)
    repo = get_or_create_repo(client, repo_name)

    files_to_push = _prepare_project_files(project)

    last_commit_sha = None
    for file_path, content in files_to_push.items():
        try:
            existing_file = repo.get_contents(file_path)
            result = repo.update_file(
                path=file_path,
                message=f"تحديث {file_path} عبر AI Training Orchestrator",
                content=content,
                sha=existing_file.sha,
            )
        except GithubException:
            result = repo.create_file(
                path=file_path,
                message=f"إضافة {file_path} عبر AI Training Orchestrator",
                content=content,
            )
        last_commit_sha = result["commit"].sha

    return {
        "repo_url": repo.html_url,
        "commit_sha": last_commit_sha or "",
    }


def _prepare_project_files(project: Any) -> dict[str, str]:
    """يجهّز محتوى الملفات الأساسية التي تُرفع تلقائيًا مع كل مشروع"""
    import json

    readme = f"""# {project.name}

{project.description or 'مشروع تدريب نموذج ذكاء اصطناعي'}

## نوع المشروع
{project.project_type.value if hasattr(project.project_type, 'value') else project.project_type}

## النموذج الأساسي
{project.base_model_id or 'غير محدد'}

## خطة التدريب
راجع ملف `training_plan.json` للتفاصيل الكاملة.

---
تم إنشاء هذا المشروع تلقائيًا عبر منصة AI Training Orchestrator
"""

    training_plan_json = json.dumps(
        project.training_plan or {}, ensure_ascii=False, indent=2
    )

    return {
        "README.md": readme,
        "training_plan.json": training_plan_json,
    }


def upload_large_model_file(repo_full_name: str, github_token: str, local_file_path: str, repo_path: str):
    """
    للملفات الكبيرة (أوزان النماذج)، يُنصح باستخدام Git LFS أو رفعها لتخزين خارجي (S3)
    وربط رابط التحميل في README بدل تضمينها مباشرة في Git العادي.
    """
    file_size_mb = os.path.getsize(local_file_path) / (1024 * 1024)
    if file_size_mb > 95:
        return {
            "warning": "الملف أكبر من حد GitHub العادي (100MB). يُنصح باستخدام Git LFS "
            "أو رفعه إلى تخزين سحابي (S3) وإضافة رابط تحميل في README."
        }

    client = Github(github_token)
    owner_name, repo_name = repo_full_name.split("/")
    repo = client.get_repo(repo_full_name)

    with open(local_file_path, "rb") as f:
        content = f.read()

    try:
        existing = repo.get_contents(repo_path)
        repo.update_file(repo_path, "رفع ملف النموذج المدرّب", content, existing.sha)
    except GithubException:
        repo.create_file(repo_path, "رفع ملف النموذج المدرّب", content)

    return {"status": "uploaded", "path": repo_path}
