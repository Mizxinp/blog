"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { Placeholder } from "@tiptap/extension-placeholder"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { extractAllExternalImageUrls, migrateImages, replaceImageUrls, hasExternalImages } from "@/lib/image-migration"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

// import content from "@/components/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

interface SimpleEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
}

export function SimpleEditor({ content: initialContent, onChange, placeholder, className }: SimpleEditorProps = {}) {
  const isMobile = useIsMobile()
  const windowSize = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  // 图片迁移相关状态
  const migratedUrlsRef = React.useRef<Set<string>>(new Set())
  const [isMigrating, setIsMigrating] = React.useState(false)
  const [migratingCount, setMigratingCount] = React.useState(0)

  // 标记是否刚发生粘贴事件
  const pendingPasteRef = React.useRef(false)

  // 异步处理图片迁移
  const handleImageMigrationAsync = async (
    editorInstance: ReturnType<typeof useEditor>,
    html: string
  ) => {
    if (!editorInstance || isMigrating) return

    const externalUrls = extractAllExternalImageUrls(html)

    // 过滤掉已经处理过的 URL
    const newUrls = externalUrls.filter(url => !migratedUrlsRef.current.has(url))

    if (newUrls.length === 0) return

    // 开始迁移，显示 loading
    setIsMigrating(true)
    setMigratingCount(newUrls.length)

    // 禁用编辑器
    editorInstance.setEditable(false)

    try {
      const migrations = await migrateImages(newUrls)

      // 记录已处理的 URL（包括失败的，避免重复尝试）
      newUrls.forEach(url => migratedUrlsRef.current.add(url))

      // 过滤出成功迁移的结果
      const successMigrations = migrations.filter(m => !m.error)

      if (successMigrations.length > 0) {
        const currentHtml = editorInstance.getHTML()
        const updatedHtml = replaceImageUrls(currentHtml, successMigrations)

        // 保存当前光标位置
        const { from, to } = editorInstance.state.selection

        // 更新编辑器内容
        editorInstance.commands.setContent(updatedHtml)

        // 尝试恢复光标位置
        try {
          editorInstance.commands.setTextSelection({ from, to })
        } catch {
          // 如果位置无效，忽略错误
        }

        // 触发 onChange
        onChange?.(updatedHtml)
      }
    } catch (error) {
      console.error('Image migration failed:', error)
    } finally {
      // 恢复编辑器
      editorInstance.setEditable(true)
      setIsMigrating(false)
      setMigratingCount(0)
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": placeholder || "Main content area, start typing to enter text.",
        class: `simple-editor ${className || ''}`.trim(),
      },
      handlePaste: (_view, event) => {
        // 检查粘贴内容是否包含外部图片（HTML 或 Markdown 格式）
        const html = event.clipboardData?.getData('text/html') || ''
        const text = event.clipboardData?.getData('text/plain') || ''

        if (hasExternalImages(html) || hasExternalImages(text)) {
          pendingPasteRef.current = true
        }
        return false // 返回 false 让默认粘贴行为继续
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML()
      onChange?.(html)

      // 如果刚发生粘贴事件，检查并迁移外部图片
      if (pendingPasteRef.current) {
        pendingPasteRef.current = false
        handleImageMigrationAsync(editorInstance, html)
      }
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Placeholder.configure({
        placeholder: placeholder || '开始写作...',
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent || '',
  })

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={
            isMobile
              ? {
                  bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
                }
              : {}
          }
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div className="simple-editor-content-wrapper">
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />

          {/* 图片迁移 Loading 遮罩 */}
          {isMigrating && (
            <div className="simple-editor-loading-overlay">
              <div className="simple-editor-loading-content">
                <div className="simple-editor-loading-spinner" />
                <p>正在迁移 {migratingCount} 张图片...</p>
              </div>
            </div>
          )}
        </div>
      </EditorContext.Provider>
    </div>
  )
}
