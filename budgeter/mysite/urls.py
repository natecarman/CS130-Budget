from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path("api/", include("myapp.urls")),
    path("admin/", admin.site.urls),
    re_path(r'^(?!admin/|api/).*$', TemplateView.as_view(template_name='index.html')),
]
