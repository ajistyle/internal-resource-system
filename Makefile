.PHONY: help status version tag push release

help:
	@echo "可用命令："
	@echo "  make status                  # 查看工作区/标签状态"
	@echo "  make version                 # 输出当前 VERSION 文件"
	@echo "  make tag VERSION=vX.Y        # 打 tag（不推送）"
	@echo "  make push                    # 推送 main 与所有 tag"
	@echo "  make release VERSION=vX.Y    # 一键：检查干净 -> 打 tag -> 推送"

status:
	@git status -sb
	@echo
	@echo "HEAD tags:"
	@git tag --points-at HEAD || true

version:
	@cat VERSION

tag:
	@if [ -z "$(VERSION)" ]; then echo "请指定 VERSION，例如：make tag VERSION=v2026.0326.2.1"; exit 1; fi
	@git tag "$(VERSION)"
	@echo "已创建 tag: $(VERSION)"

push:
	@git push -u origin main
	@git push --tags

release:
	@if [ -z "$(VERSION)" ]; then echo "请指定 VERSION，例如：make release VERSION=v2026.0326.2.1"; exit 1; fi
	@if [ -n "$$(git status --porcelain)" ]; then echo "工作区不干净，请先提交或清理后再发布。"; git status --porcelain; exit 1; fi
	@if git rev-parse "$(VERSION)" >/dev/null 2>&1; then echo "tag 已存在：$(VERSION)"; exit 1; fi
	@$(MAKE) tag VERSION="$(VERSION)"
	@$(MAKE) push
	@echo "发布完成：$(VERSION)"
