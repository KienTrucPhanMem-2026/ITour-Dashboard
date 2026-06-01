"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Trash2,
  Plus,
  Edit,
  UploadCloud,
  Search,
  X,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  MapPin,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Loader2,
  NotebookPen,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { tourService } from "@/services/tourService";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";

// Enums matching the backend
export type BlogStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type BlogTag = "TRAVEL_TIPS" | "PROMOTIONS" | "FOOD_CULTURE";

export interface BlogDTO {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  thumbnailUrl?: string;
  content?: string;
  status: BlogStatus;
  tag: BlogTag;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tourIds?: string; // Comma separated string from database
  consultant?: {
    id: string;
    fullName: string;
    userName: string;
  };
}

const BLOG_TAG_LABELS: Record<BlogTag, string> = {
  TRAVEL_TIPS: "Kinh nghiệm du lịch",
  PROMOTIONS: "Khuyến mãi",
  FOOD_CULTURE: "Khám phá ẩm thực",
};

const BLOG_TAG_COLORS: Record<BlogTag, { bg: string; text: string }> = {
  TRAVEL_TIPS: { bg: "rgba(16,185,129,0.12)", text: "#059669" },
  PROMOTIONS: { bg: "rgba(245,101,65,0.12)", text: "#ea580c" },
  FOOD_CULTURE: { bg: "rgba(168,85,247,0.12)", text: "#9333ea" },
};

const BLOG_STATUS_LABELS: Record<BlogStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  HIDDEN: "Bị ẩn",
  ARCHIVED: "Lưu trữ",
};

const BLOG_STATUS_COLORS: Record<BlogStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HIDDEN: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ConsultantBlogsPage() {
  const user = useUserStore();
  const router = useRouter();

  // Page level state
  const [view, setView] = useState<"list" | "editor">("list");
  const [blogs, setBlogs] = useState<BlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Editor specific state
  const [blogId, setBlogId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [tag, setTag] = useState<BlogTag>("TRAVEL_TIPS");
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  
  // Autocomplete Tours
  const [allTours, setAllTours] = useState<any[]>([]);
  const [tourSearchTerm, setTourSearchTerm] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Reusable Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const showConfirm = (title: string, desc: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setOnConfirm(() => action);
    setConfirmOpen(true);
  };

  // References
  const editorRef = useRef<HTMLDivElement>(null);

  // Load Blogs and Tours
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<BlogDTO[]>("/blogs");
      if (response.success && response.data) {
        // Filter blogs belonging to this consultant
        const filtered = response.data.filter(
          (b) => b.consultant?.id === user?.id
        );
        setBlogs(filtered);
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
      toast.error("Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTours = async () => {
    try {
      // Fetch active tours for linked tours select
      const response = await apiClient.get<any>("/tours");
      if (response.success && response.data) {
        let tourList: any[] = [];
        if (Array.isArray(response.data)) {
          tourList = response.data;
        } else if (response.data.content) {
          tourList = response.data.content;
        }
        setAllTours(tourList);
      }
    } catch (e) {
      console.error("Failed to load tours list", e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBlogs();
      fetchTours();
    }
  }, [user]);

  // Handle Slug generation from Vietnamese Title
  const slugify = (text: string) => {
    if (!text) return "";
    let s = text.toLowerCase();
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
    s = s.replace(/[đĐ]/g, "d");
    s = s.replace(/[^a-z0-9\s-]/g, ""); // Remove invalid chars
    s = s.trim().replace(/\s+/g, "-").replace(/-+/g, "-"); // Collapse whitespace & hyphens
    return s;
  };

  useEffect(() => {
    if (!isSlugModified && view === "editor") {
      setSlug(slugify(title));
    }
  }, [title, isSlugModified, view]);

  // Auto-save logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "editor") {
      interval = setInterval(() => {
        const draftData = {
          title,
          slug,
          summary,
          content,
          thumbnailUrl,
          tag,
          status,
          selectedTourIds,
          timestamp: new Date().toLocaleTimeString("vi-VN"),
        };
        localStorage.setItem(`blog_draft_${blogId || "new"}`, JSON.stringify(draftData));
        const now = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setAutoSavedAt(now);
      }, 30000); // every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, blogId, title, slug, summary, content, thumbnailUrl, tag, status, selectedTourIds]);

  // Check for auto-saved drafts on enter editor
  const handleCheckDraft = (id: string | null) => {
    const saved = localStorage.getItem(`blog_draft_${id || "new"}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        toast("Tìm thấy bản nháp tự động lưu!", {
          description: `Bản nháp lưu lúc ${parsed.timestamp}. Bạn có muốn khôi phục?`,
          action: {
            label: "Khôi phục",
            onClick: () => {
              setTitle(parsed.title || "");
              setSlug(parsed.slug || "");
              setSummary(parsed.summary || "");
              setContent(parsed.content || "");
              setThumbnailUrl(parsed.thumbnailUrl || "");
              setTag(parsed.tag || "TRAVEL_TIPS");
              setStatus(parsed.status || "DRAFT");
              setSelectedTourIds(parsed.selectedTourIds || []);
              if (editorRef.current) {
                editorRef.current.innerHTML = parsed.content || "";
              }
              toast.success("Khôi phục bản nháp thành công!");
            },
          },
        });
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  };

  // Editor Actions
  const handleOpenCreate = () => {
    setBlogId(null);
    setTitle("");
    setSlug("");
    setIsSlugModified(false);
    setSummary("");
    setContent("");
    setThumbnailUrl("");
    setTag("TRAVEL_TIPS");
    setStatus("DRAFT");
    setSelectedTourIds([]);
    setAutoSavedAt(null);
    setView("editor");
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
      handleCheckDraft(null);
    }, 100);
  };

  const handleOpenEdit = (blog: BlogDTO) => {
    setBlogId(blog.id);
    setTitle(blog.title);
    setSlug(blog.slug);
    setIsSlugModified(true);
    setSummary(blog.summary || "");
    setContent(blog.content || "");
    setThumbnailUrl(blog.thumbnailUrl || "");
    setTag(blog.tag);
    setStatus(blog.status);
    
    // Parse comma separated tours
    const tours = blog.tourIds ? blog.tourIds.split(",").filter(Boolean) : [];
    setSelectedTourIds(tours);
    setAutoSavedAt(null);
    setView("editor");

    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = blog.content || "";
      handleCheckDraft(blog.id);
    }, 100);
  };

  const handleSaveBlog = async (targetStatus?: BlogStatus) => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Vui lòng nhập đường dẫn SEO (Slug).");
      return;
    }

    setSaving(true);
    const saveStatus = targetStatus || status;
    const finalContent = editorRef.current?.innerHTML || content;

    const payload = {
      title,
      slug,
      summary,
      thumbnailUrl,
      content: finalContent,
      status: saveStatus,
      tag,
      tourIds: selectedTourIds.join(","),
      consultant: {
        id: user?.id,
        fullName: user?.fullName,
        userName: user?.userName
      }
    };

    try {
      let res;
      if (blogId) {
        // Edit Blog
        res = await apiClient.put(`/blogs/${blogId}`, payload);
      } else {
        // Create Blog
        res = await apiClient.post("/blogs", payload);
      }

      if (res.success) {
        toast.success(
          saveStatus === "PUBLISHED"
            ? "Đăng bài viết thành công!"
            : "Đã lưu bản nháp thành công!"
        );
        // Clear draft in localStorage
        localStorage.removeItem(`blog_draft_${blogId || "new"}`);
        setView("list");
        fetchBlogs();
      } else {
        toast.error(res.message || "Không thể lưu bài viết. Vui lòng kiểm tra lại slug trùng.");
      }
    } catch (e: any) {
      console.error("Save error", e);
      toast.error("Đã xảy ra lỗi khi gửi dữ liệu lên server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = (id: string) => {
    showConfirm(
      "Xóa bài viết",
      "Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.",
      async () => {
        try {
          const res = await apiClient.delete(`/blogs/${id}`);
          if (res.success) {
            toast.success("Xóa bài viết thành công!");
            fetchBlogs();
          } else {
            toast.error("Không thể xóa bài viết.");
          }
        } catch (e) {
          console.error("Delete error", e);
          toast.error("Đã xảy ra lỗi khi kết nối server.");
        }
      }
    );
  };

  // Thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const res = await uploadToCloudinary(file);
      if (res.success && res.imageUrl) {
        setThumbnailUrl(res.imageUrl);
        toast.success("Tải lên ảnh bìa thành công!");
      } else {
        toast.error(res.error || "Tải lên thất bại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi tải lên ảnh bìa.");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Rich Text Editor Command Helpers
  const execEditorCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Rich Text Editor Inline image insert helper
  const handleInsertImage = async (file: File) => {
    const toastId = toast.loading("Đang tải ảnh lên Cloudinary...");
    try {
      const res = await uploadToCloudinary(file);
      if (res.success && res.imageUrl) {
        // Insert custom interactive block
        const imgHtml = `
          <div class="my-6 inline-image-container flex flex-col items-center group relative border border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-2 transition-all max-w-[85%] mx-auto" data-align="center">
            <img src="${res.imageUrl}" class="rounded-xl max-w-full max-h-[500px] object-contain shadow-sm" />
            <div class="mt-2 text-sm text-slate-500 italic text-center outline-none empty:before:content-['Nhập_chú_thích_ảnh...'] empty:before:text-slate-400" contenteditable="true">Nhấp để thêm chú thích ảnh</div>
          </div>
          <p><br></p>
        `;
        execEditorCommand("insertHTML", imgHtml);
        toast.success("Chèn ảnh thành công!", { id: toastId });
      } else {
        toast.error(res.error || "Lỗi tải ảnh.", { id: toastId });
      }
    } catch (e) {
      toast.error("Lỗi khi kết nối Cloudinary.", { id: toastId });
    }
  };

  // Handle Drag & Drop inside editor
  const handleEditorDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        await handleInsertImage(file);
      } else {
        toast.error("Chỉ hỗ trợ kéo thả tệp hình ảnh.");
      }
    }
  };

  // List view filters
  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.summary && b.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Linked tours selector
  const availableToursToSelect = allTours.filter(
    (tour) =>
      tour.name.toLowerCase().includes(tourSearchTerm.toLowerCase()) &&
      !selectedTourIds.includes(tour.id)
  );

  const selectedTours = allTours.filter((tour) =>
    selectedTourIds.includes(tour.id)
  );

  return (
    <DashboardLayout isFullWidth={view === "editor"} focusMode={view === "editor"}>
      {view === "list" ? (
        /* ───────────────────────────────────────────────────────────────────────
           LIST VIEW: Slippery and Premium Blogs Dashboard
           ─────────────────────────────────────────────────────────────────────── */
        <div>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bài viết của tôi</h1>
              <p className="text-slate-500 mt-2">Viết bài chuẩn SEO, chia sẻ kinh nghiệm du lịch và liên kết Tour.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Search Input - Optimized Pill Style */}
              <div className="relative flex items-center w-full sm:w-64 md:w-80">
                <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-slate-100/80 border-0 shadow-none text-sm text-slate-800 placeholder:text-slate-400/80 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all duration-200"
                />
              </div>

              <Button
                onClick={handleOpenCreate}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-5 h-11 font-semibold shadow-lg shadow-indigo-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus className="w-5 h-5" />
                Tạo bài viết mới
              </Button>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-sm rounded-3xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 flex flex-col justify-center border border-indigo-100/10">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Đã xuất bản (Published)</span>
              <span className="text-2xl font-extrabold text-indigo-900 mt-1">
                {blogs.filter((b) => b.status === "PUBLISHED").length} bài viết
              </span>
            </Card>

            <Card className="border-0 shadow-sm rounded-3xl p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 flex flex-col justify-center border border-slate-200/10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bản nháp (Drafts)</span>
              <span className="text-2xl font-extrabold text-slate-700 mt-1">
                {blogs.filter((b) => b.status === "DRAFT").length} bài viết
              </span>
            </Card>
          </div>

          {/* Blogs Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-slate-400 text-sm">Đang tải danh sách bài viết...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-3xl p-16 text-center bg-white flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Chưa có bài viết nào</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">
                Bắt đầu viết các bài chia sẻ kinh nghiệm để thu hút khách hàng và liên kết Tour OTA.
              </p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-6 border-slate-200 text-slate-700 font-semibold px-6 rounded-xl hover:bg-slate-50"
              >
                Tạo bài viết đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => (
                <Card
                  key={blog.id}
                  className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden group flex flex-col h-full hover:shadow-md transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
                    {blog.thumbnailUrl ? (
                      <img
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12" />
                        <span className="text-xs mt-1">Không có ảnh bìa</span>
                      </div>
                    )}
                    {/* Tag Badge */}
                    <div
                      className="absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md"
                      style={{
                        backgroundColor: BLOG_TAG_COLORS[blog.tag]?.bg || "rgba(255,255,255,0.8)",
                        color: BLOG_TAG_COLORS[blog.tag]?.text || "#333",
                      }}
                    >
                      {BLOG_TAG_LABELS[blog.tag]}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${BLOG_STATUS_COLORS[blog.status]}`}>
                          {BLOG_STATUS_LABELS[blog.status]}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h3>

                      <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                        {blog.summary || "Chưa có mô tả ngắn. Nhập mô tả để thu hút người đọc hơn."}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-4 mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Eye className="w-4 h-4" />
                        <span>{blog.viewCount} lượt đọc</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleOpenEdit(blog)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteBlog(blog.id)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────────────────
           EDITOR VIEW: Distraction-Free Focus Mode
           ─────────────────────────────────────────────────────────────────────── */
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Editor Header - Stick to top */}
          <header className="sticky top-0 z-40 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  showConfirm(
                    "Xác nhận quay lại",
                    "Mọi thay đổi chưa lưu của bạn có thể bị mất. Bạn có chắc chắn muốn quay lại danh sách bài viết?",
                    () => {
                      setView("list");
                      fetchBlogs();
                    }
                  );
                }}
                className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center text-slate-600 shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                  {blogId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-none truncate max-w-[250px] sm:max-w-md mt-0.5">
                  {title || "Bài viết chưa đặt tên"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {autoSavedAt && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Đã tự động lưu lúc {autoSavedAt}
                </span>
              )}

              <Button
                onClick={() => setPreviewing(true)}
                variant="outline"
                className="border-slate-200 text-slate-700 rounded-2xl font-semibold px-4 h-11 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Xem trước
              </Button>

              <Button
                onClick={() => handleSaveBlog("DRAFT")}
                disabled={saving}
                variant="outline"
                className="border-slate-200 text-slate-700 bg-white rounded-2xl font-semibold px-4 h-11 hover:bg-slate-50 flex items-center gap-2"
              >
                {saving && status === "DRAFT" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu nháp
              </Button>

              <Button
                onClick={() => handleSaveBlog("PUBLISHED")}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold px-5 h-11 shadow-md shadow-indigo-100 flex items-center gap-2 transition-colors"
              >
                {saving && status === "PUBLISHED" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Xuất bản
              </Button>
            </div>
          </header>

          {/* Editor Body Grid 7-3 */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
            
            {/* Cột Chính (70% - Bên Trái) - Vùng Soạn Thảo */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card className="border-0 shadow-sm rounded-3xl bg-white p-6 md:p-10 flex flex-col gap-6">
                
                {/* Title and Auto Slug */}
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề bài viết... (Ví dụ: Kinh nghiệm du lịch Ninh Bình tự túc)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl md:text-3xl font-extrabold text-slate-900 border-0 outline-none p-0 focus:ring-0 placeholder:text-slate-300 bg-transparent tracking-tight leading-tight"
                  />
                  
                  {/* SEO friendly Slug */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 py-1 px-3 bg-slate-50 rounded-xl w-fit">
                    <span className="font-semibold text-slate-500">Đường dẫn SEO:</span>
                    <span className="font-mono truncate max-w-[200px] sm:max-w-sm text-blue-600">
                      domain.com/blog/{slug || "kinh-nghiem-du-lich"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-blue-500 hover:text-blue-700 ml-1 font-semibold focus:outline-none">
                          [Chỉnh sửa]
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-3 w-72">
                        <label className="text-xs font-bold text-slate-600">Chỉnh sửa Slug SEO</label>
                        <Input
                          type="text"
                          value={slug}
                          onChange={(e) => {
                            setSlug(slugify(e.target.value));
                            setIsSlugModified(true);
                          }}
                          className="mt-1 h-8 text-xs font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Chỉ sử dụng chữ thường, không dấu và dấu gạch ngang.</p>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Excerpt/Summary */}
                <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mô tả ngắn (Summary)</label>
                    <span className={`text-xs font-semibold transition-all duration-150 ${summary.length > 160 ? "text-red-500 font-bold animate-pulse scale-105" : "text-slate-400"}`}>
                      {summary.length}/160
                    </span>
                  </div>
                  <Textarea
                    placeholder="Viết đoạn tóm tắt khoảng 2-3 dòng giới thiệu bài viết để hiện ngoài trang danh sách (card)..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full min-h-[100px] border border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50/20 focus-visible:bg-white placeholder:text-slate-400 leading-relaxed transition-all duration-200 resize-none shadow-none outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    💡 Đoạn mô tả này hiển thị trên các thẻ bài viết ngoài trang chủ và dùng làm Meta Description chuẩn SEO (Khuyên dùng từ 150 đến 160 ký tự).
                  </p>
                </div>

                {/* Minimalist Rich Text Editor */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-2xl border sticky top-[80px] z-30 shadow-sm backdrop-blur-md">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("formatBlock", "<h2>")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Tiêu đề lớn H2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("formatBlock", "<h3>")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Tiêu đề vừa H3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("bold")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="In đậm"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("italic")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="In nghiêng"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("insertUnorderedList")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Danh sách dấu chấm"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("insertOrderedList")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Danh sách số"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => execEditorCommand("formatBlock", "<blockquote>")}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Trích dẫn Blockquote"
                    >
                      <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const url = prompt("Nhập đường dẫn URL:");
                        if (url) execEditorCommand("createLink", url);
                      }}
                      className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                      title="Chèn Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    
                    {/* Inline Image Upload Trigger */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-600"
                        title="Chèn hình ảnh"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleInsertImage(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Editable Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onDrop={handleEditorDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onBlur={() => {
                      if (editorRef.current) {
                        setContent(editorRef.current.innerHTML);
                      }
                    }}
                    className="min-h-[500px] outline-none text-slate-800 text-lg leading-relaxed px-2 py-4 prose prose-slate max-w-none focus:ring-0 empty:before:content-['Bắt_đầu_soạn_thảo_nội_dung_bài_viết_tại_đây..._Bạn_có_thể_kéo_thả_hình_ảnh_trực_tiếp_vào_khung_này.'] empty:before:text-slate-300 empty:before:pointer-events-none empty:before:block"
                  />
                </div>
              </Card>
            </div>

            {/* Cột Phụ (30% - Bên Phải) - Vùng Cấu Hình & Chốt Sale */}
            <div className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-[90px] h-fit">
              
              {/* Featured Image upload dragger */}
              <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Ảnh bìa bài viết
                </h3>

                <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors flex flex-col items-center justify-center p-3 text-center cursor-pointer overflow-hidden group">
                  {thumbnailUrl ? (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt="Ảnh bìa"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                        <UploadCloud className="w-4 h-4" /> Thay đổi ảnh
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {uploadingThumbnail ? (
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      ) : (
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      )}
                      <span className="text-xs font-semibold text-slate-700">Kéo thả hoặc nhấp chọn</span>
                      <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WebP (Tỉ lệ 16:9)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                  💡 Ảnh bìa nên có kích thước tối thiểu 1200x675px để hiển thị đẹp nhất trên mọi thiết bị.
                </p>
              </Card>

              {/* Categorization */}
              <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Phân loại bài viết
                  </h3>

                  <label className="text-xs font-semibold text-slate-500 block mb-1">Chủ đề chính (Category)</label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as BlogTag)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="TRAVEL_TIPS">Kinh nghiệm du lịch</option>
                    <option value="PROMOTIONS">Khuyến mãi</option>
                    <option value="FOOD_CULTURE">Khám phá ẩm thực</option>
                  </select>
                </div>
              </Card>

              {/* OTA Tour Upsell - The core money feature */}
              <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Liên kết Tour (Upsell)
                </h3>
                <p className="text-xs text-slate-400 leading-normal mb-4">
                  Bài viết này thuộc chủ đề gì? Hãy gắn 2-3 Tour liên quan để hiển thị chốt sale chéo.
                </p>

                {/* Tour selector search autocomplete */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm tour theo tên..."
                    value={tourSearchTerm}
                    onChange={(e) => setTourSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-xl border-slate-200 text-xs bg-slate-50/50"
                  />
                  
                  {/* Autocomplete Dropdown list */}
                  {tourSearchTerm.trim() && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-lg z-50 p-1 text-xs">
                      {availableToursToSelect.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">Không tìm thấy tour phù hợp</div>
                      ) : (
                        availableToursToSelect.map((tour) => (
                          <button
                            key={tour.id}
                            type="button"
                            onClick={() => {
                              setSelectedTourIds((prev) => [...prev, tour.id]);
                              setTourSearchTerm("");
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-100"
                          >
                            <img
                              src={tour.image}
                              alt={tour.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 truncate leading-tight">{tour.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{tour.destination}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected tours visualization list */}
                <div className="flex flex-col gap-2">
                  {selectedTours.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-slate-100 rounded-2xl text-[11px] text-slate-400">
                      Chưa có tour liên kết nào được chọn.
                    </div>
                  ) : (
                    selectedTours.map((tour) => (
                      <div
                        key={tour.id}
                        className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl relative group"
                      >
                        <img
                          src={tour.image}
                          alt={tour.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="font-semibold text-[11px] text-slate-800 truncate leading-tight">
                            {tour.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{tour.destination}</span>
                          <span className="text-[11px] font-bold text-indigo-600 block mt-0.5">
                            {tour.price.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <Button
                          onClick={() =>
                            setSelectedTourIds((prev) => prev.filter((id) => id !== tour.id))
                          }
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 absolute top-1.5 right-1.5 shrink-0 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────────────
             PREVIEW MODAL: Full Screen Simulated Experience
             ─────────────────────────────────────────────────────────────────────── */}
          {previewing && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden border animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-sm">Giao diện xem trước thực tế bài đăng</span>
                  </div>
                  <Button
                    onClick={() => setPreviewing(false)}
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 scrollbar-thin">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Main Article (Left) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Realistic Blog Banner */}
                      <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-slate-100 shadow-md">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <ImageIcon className="w-16 h-16" />
                            <span className="text-sm mt-2">Ảnh bìa chưa được cấu hình</span>
                          </div>
                        )}
                        
                        {/* Glassmorphic Category tag */}
                        <div
                          className="absolute top-6 left-6 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/20"
                          style={{
                            backgroundColor: BLOG_TAG_COLORS[tag]?.bg || "rgba(255,255,255,0.85)",
                            color: BLOG_TAG_COLORS[tag]?.text || "#333",
                          }}
                        >
                          {BLOG_TAG_LABELS[tag]}
                        </div>
                      </div>

                      {/* Header details */}
                      <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-serif">
                          {title || "Tiêu đề bài viết của bạn sẽ hiển thị tại đây"}
                        </h1>

                        {/* Author metadata bar */}
                        <div className="flex items-center gap-4 mt-6 border-y border-slate-200/80 py-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                            {user?.fullName?.[0] || "C"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {user?.fullName || "Tư vấn viên iTour"}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Hôm nay</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 mx-1" />
                              <Clock className="w-3.5 h-3.5" />
                              <span>5 phút đọc</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      {summary && (
                        <p className="text-slate-500 font-medium italic border-l-4 border-indigo-500 pl-4 py-1 text-base leading-relaxed bg-slate-100/50 pr-2 rounded-r-xl">
                          {summary}
                        </p>
                      )}

                      {/* Content HTML Renderer */}
                      <div
                        className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans text-base prose-headings:font-serif"
                        dangerouslySetInnerHTML={{
                          __html: editorRef.current?.innerHTML || content || "<p className='text-slate-400 italic'>Nội dung bài viết trống.</p>",
                        }}
                      />
                    </div>

                    {/* Sidebar Upsell Panel (Right) */}
                    <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-0">
                      {selectedTours.length > 0 && (
                        <Card className="border border-indigo-100 shadow-md shadow-indigo-50/50 rounded-3xl p-5 bg-white">
                          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2 border-b pb-3 border-slate-100">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            Gợi ý Tour liên quan
                          </h3>
                          
                          <div className="flex flex-col gap-4 mt-4">
                            {selectedTours.map((tour) => (
                              <div
                                key={tour.id}
                                className="flex flex-col border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                              >
                                <div className="aspect-[16/9] overflow-hidden bg-slate-100 relative shrink-0">
                                  <img
                                    src={tour.image}
                                    alt={tour.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                                  />
                                </div>
                                <div className="p-4 flex-1">
                                  <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                    {tour.name}
                                  </h4>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="truncate">{tour.destination}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3 shrink-0">
                                    <span className="text-[10px] text-slate-400">Giá chỉ từ</span>
                                    <span className="font-extrabold text-xs text-indigo-600">
                                      {tour.price.toLocaleString("vi-VN")} đ
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                  <Button
                    onClick={() => setPreviewing(false)}
                    variant="outline"
                    className="border-slate-200 text-slate-700 rounded-xl"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reusable Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{confirmTitle}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{confirmDesc}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border-slate-200 text-slate-700 font-semibold px-4 h-10 hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  setConfirmOpen(false);
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 h-10 shadow-md shadow-indigo-100 transition-colors"
              >
                Xác nhận
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
