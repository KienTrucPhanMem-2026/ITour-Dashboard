"use client";

import { useEffect, useState } from "react";
import { 
  Tabs, Card, Form, Input, Select, Button, Avatar, Upload, 
  Row, Col, message, Progress, Space, InputNumber, Alert 
} from "antd";
import { 
  UserOutlined, LockOutlined, SafetyCertificateOutlined, UploadOutlined, 
  EyeOutlined, EyeInvisibleOutlined, ExclamationCircleOutlined,
  LogoutOutlined, DeleteOutlined
} from "@ant-design/icons";
import { useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

// Form Item styles
const cardStyle = {
  borderRadius: "20px",
  border: "1px solid rgba(63, 94, 168, 0.12)",
  boxShadow: "0 4px 20px -2px rgba(63, 94, 168, 0.05)",
  background: "#ffffff",
};

export default function SharedSettings() {
  const userStore = useUserStore();
  const router = useRouter();
  const userId = userStore?.id;
  const userRole = userStore?.role;

  // General profile state
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [expertForm] = Form.useForm();
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingExpert, setSavingExpert] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [passwordColor, setPasswordColor] = useState<string>("#ff4d4f");
  const [passwordStatus, setPasswordStatus] = useState<string>("Yếu");

  // Load Profile from DB
  const fetchProfile = async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const res = await apiClient.get<any>(`/users/${userId}/profile`);
      if (res.success && res.data) {
        const data = res.data;
        profileForm.setFieldsValue({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          identityNumber: data.identityNumber,
          gender: data.gender || "Nam",
          bio: data.bio || "",
        });
        
        // Load role specialized fields
        if (userRole === "TOURGUIDE") {
          expertForm.setFieldsValue({
            languages: data.languages || ["Tiếng Anh"],
            experienceYears: data.experienceYears || 2,
            certificates: data.certificates || []
          });
        }
        
        // Generate placeholder avatar based on initials if none exists
        const initials = data.fullName
          ? data.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
          : "U";
        setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=047857&textColor=ffffff`);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      message.error("Không thể lấy thông tin hồ sơ.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Handle saving general profile
  const onSaveProfile = async (values: any) => {
    if (!userId) return;
    setSavingProfile(true);
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        dateOfBirth: values.dateOfBirth,
        identityNumber: values.identityNumber,
      };
      
      const res = await apiClient.put<any>(`/users/${userId}/profile`, payload);
      if (res.success) {
        message.success("Cập nhật thông tin cá nhân thành công!");
        // Update user store if name changed
        if (userStore) {
          const updatedUser = { ...userStore, fullName: values.fullName };
          window.localStorage.setItem("itour_user", JSON.stringify(updatedUser));
        }
      } else {
        message.error(res.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu thông tin.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Password strength checker
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (val.length >= 6) strength += 20;
    if (val.length >= 10) strength += 20;
    if (/[A-Z]/.test(val)) strength += 20;
    if (/[0-9]/.test(val)) strength += 20;
    if (/[^A-Za-z0-9]/.test(val)) strength += 20;
    
    setPasswordStrength(strength);

    if (strength <= 40) {
      setPasswordColor("#ff4d4f"); // Red
      setPasswordStatus("Yếu");
    } else if (strength <= 80) {
      setPasswordColor("#faad14"); // Amber
      setPasswordStatus("Trung bình");
    } else {
      setPasswordColor("#52c41a"); // Green
      setPasswordStatus("Mạnh");
    }
  };

  // Handle saving password (Security)
  const onSaveSecurity = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    
    setSavingSecurity(true);
    try {
      // Simulate API change password call with 1s delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success("Đổi mật khẩu thành công!");
      securityForm.resetFields();
      setPasswordStrength(0);
    } catch (err) {
      message.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setSavingSecurity(false);
    }
  };

  // Handle saving expertise (Tour Guide settings)
  const onSaveExpert = async (values: any) => {
    setSavingExpert(true);
    try {
      // Simulate API update
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success("Cập nhật hồ sơ chuyên môn thành công!");
    } catch (err) {
      message.error("Không thể cập nhật thông tin chuyên môn.");
    } finally {
      setSavingExpert(false);
    }
  };

  // Danger zone handlers
  const handleSignOutAll = () => {
    message.loading({ content: "Đang đăng xuất khỏi các thiết bị...", key: "signout" });
    setTimeout(() => {
      message.success({ content: "Đã đăng xuất khỏi tất cả thiết bị thành công!", key: "signout" });
    }, 1200);
  };

  const handleDeleteAccount = () => {
    message.error("Yêu cầu xóa tài khoản đã được ghi nhận. Quản trị viên sẽ liên hệ với bạn trong 24h.");
  };

  // Dynamic Avatar Upload simulation
  const handleAvatarChange = (info: any) => {
    if (info.file.status === "uploading") {
      return;
    }
    // Simulate successful avatar update
    message.loading({ content: "Đang tải ảnh đại diện lên...", key: "avatar" });
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
        message.success({ content: "Cập nhật ảnh đại diện thành công!", key: "avatar" });
      };
      if (info.file.originFileObj) {
        reader.readAsDataURL(info.file.originFileObj);
      }
    }, 1000);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN": return "Quản trị viên";
      case "TOURGUIDE": return "Hướng dẫn viên";
      case "CONSULTANT": return "Tư vấn viên";
      case "TOURPLANNER": return "Lịch trình viên";
      default: return "Thành viên";
    }
  };

  const tabItems = [
    {
      key: "profile",
      label: (
        <span className="flex items-center gap-2 py-1 font-bold text-xs uppercase tracking-wider">
          <UserOutlined /> Hồ sơ cá nhân
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          {/* Avatar Section */}
          <Card style={cardStyle} className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar size={90} src={avatarUrl} className="border-4 border-slate-100 shadow-sm shrink-0" />
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-black text-slate-800 leading-tight">
                  {userStore?.fullName || userStore?.userName}
                </h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Chức vụ: <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{getRoleBadge(userRole)}</span>
                </p>
                <div className="mt-4">
                  <Upload 
                    showUploadList={false} 
                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 0)}
                    onChange={handleAvatarChange}
                  >
                    <Button icon={<UploadOutlined />} className="rounded-xl border-slate-200 text-slate-700 font-semibold text-xs h-9">
                      Thay đổi ảnh đại diện
                    </Button>
                  </Upload>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Basic Info */}
          <Card title={<span className="font-black text-sm text-slate-800 uppercase tracking-wide">Thông tin cơ bản</span>} style={cardStyle}>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={onSaveProfile}
              className="font-semibold text-slate-700"
            >
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                  >
                    <Input className="rounded-xl h-10 border-slate-200" placeholder="Nhập họ và tên" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                  >
                    <Select className="rounded-xl h-10 border-slate-200" size="large">
                      <Select.Option value="Nam">Nam</Select.Option>
                      <Select.Option value="Nữ">Nữ</Select.Option>
                      <Select.Option value="Khác">Khác</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                  >
                    <Input className="rounded-xl h-10 border-slate-200 bg-slate-50/75 cursor-not-allowed" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                  >
                    <Input className="rounded-xl h-10 border-slate-200" placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Số CCCD / CMND / Hộ chiếu"
                    name="identityNumber"
                  >
                    <Input className="rounded-xl h-10 border-slate-200" placeholder="Nhập số giấy tờ cá nhân" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Ngày sinh"
                    name="dateOfBirth"
                    help="Định dạng: YYYY-MM-DD (Ví dụ: 1995-10-25)"
                  >
                    <Input className="rounded-xl h-10 border-slate-200" placeholder="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Địa chỉ"
                name="address"
              >
                <Input className="rounded-xl h-10 border-slate-200" placeholder="Nhập địa chỉ của bạn" />
              </Form.Item>

              {/* Bio for Guides or Consultants */}
              {(userRole === "TOURGUIDE" || userRole === "CONSULTANT") && (
                <Form.Item
                  label="Giới thiệu bản thân (Bio)"
                  name="bio"
                >
                  <Input.TextArea rows={4} className="rounded-xl border-slate-200 p-3" placeholder="Đoạn văn ngắn giới thiệu về thế mạnh và châm ngôn làm việc của bạn..." />
                </Form.Item>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-4 mt-2">
                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={savingProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold px-6 shadow-sm border-transparent"
                  >
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </div>
            </Form>
          </Card>
        </Space>
      )
    },
    {
      key: "security",
      label: (
        <span className="flex items-center gap-2 py-1 font-bold text-xs uppercase tracking-wider">
          <LockOutlined /> Bảo mật
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          {/* Change Password Card */}
          <Card title={<span className="font-black text-sm text-slate-800 uppercase tracking-wide">Thay đổi mật khẩu</span>} style={cardStyle}>
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={onSaveSecurity}
              className="font-semibold text-slate-700"
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
              >
                <Input.Password 
                  className="rounded-xl h-10 border-slate-200" 
                  placeholder="Nhập mật khẩu hiện tại"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 6, message: "Mật khẩu phải tối thiểu 6 ký tự" }
                ]}
              >
                <Input.Password 
                  className="rounded-xl h-10 border-slate-200" 
                  placeholder="Nhập mật khẩu mới"
                  onChange={handlePasswordChange}
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              {/* Password strength indicator */}
              {passwordStrength > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    <span>Độ mạnh mật khẩu:</span>
                    <span style={{ color: passwordColor }}>{passwordStatus}</span>
                  </div>
                  <Progress percent={passwordStrength} strokeColor={passwordColor} showInfo={false} size="small" />
                </div>
              )}

              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới" }]}
              >
                <Input.Password 
                  className="rounded-xl h-10 border-slate-200" 
                  placeholder="Xác nhận mật khẩu mới"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div className="flex justify-end border-t border-slate-100 pt-4 mt-2">
                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={savingSecurity}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold px-6 shadow-sm border-transparent"
                  >
                    Lưu mật khẩu
                  </Button>
                </Form.Item>
              </div>
            </Form>
          </Card>

          {/* Danger Zone */}
          <Card 
            title={<span className="font-black text-sm text-red-600 uppercase tracking-wide">Danger Zone (Khu vực nguy hiểm)</span>} 
            style={{
              ...cardStyle,
              border: "1px solid rgba(239, 68, 68, 0.2)",
              background: "rgba(239, 68, 68, 0.02)"
            }}
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 bg-red-50/50 rounded-2xl">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">Đăng xuất khỏi thiết bị khác</h5>
                  <p className="text-slate-400 text-xs mt-1">Hành động này sẽ thu hồi toàn bộ token đăng nhập và đăng xuất bạn ra khỏi các trình duyệt khác.</p>
                </div>
                <Button 
                  danger 
                  icon={<LogoutOutlined />}
                  onClick={handleSignOutAll} 
                  className="rounded-xl font-bold h-10 text-xs shrink-0"
                >
                  Đăng xuất tất cả
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 bg-red-50/50 rounded-2xl">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">Yêu cầu xóa tài khoản</h5>
                  <p className="text-slate-400 text-xs mt-1">Xóa vĩnh viễn tài khoản của bạn và toàn bộ hồ sơ dữ liệu. Hành động này không thể hoàn tác.</p>
                </div>
                <Button 
                  danger 
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white border-transparent rounded-xl font-bold h-10 text-xs shrink-0"
                >
                  Yêu cầu xóa tài khoản
                </Button>
              </div>
            </div>
          </Card>
        </Space>
      )
    }
  ];

  // Tab C: Professional Profile for specific roles
  if (userRole === "TOURGUIDE") {
    tabItems.push({
      key: "expertise",
      label: (
        <span className="flex items-center gap-2 py-1 font-bold text-xs uppercase tracking-wider">
          <SafetyCertificateOutlined /> Hồ sơ chuyên môn
        </span>
      ),
      children: (
        <Card title={<span className="font-black text-sm text-slate-800 uppercase tracking-wide">Cài đặt Hồ sơ Hướng dẫn viên</span>} style={cardStyle}>
          <Form
            form={expertForm}
            layout="vertical"
            onFinish={onSaveExpert}
            className="font-semibold text-slate-700"
          >
            <Form.Item
              label="Ngoại ngữ giao tiếp"
              name="languages"
              help="Chọn hoặc tự gõ thêm ngoại ngữ (Nhấn enter để thêm)"
            >
              <Select 
                mode="tags" 
                size="large"
                className="rounded-xl w-full"
                placeholder="Chọn ngôn ngữ"
              >
                <Select.Option value="Tiếng Anh">Tiếng Anh</Select.Option>
                <Select.Option value="Tiếng Trung">Tiếng Trung</Select.Option>
                <Select.Option value="Tiếng Pháp">Tiếng Pháp</Select.Option>
                <Select.Option value="Tiếng Nhật">Tiếng Nhật</Select.Option>
                <Select.Option value="Tiếng Hàn">Tiếng Hàn</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Số năm kinh nghiệm"
              name="experienceYears"
            >
              <InputNumber min={0} max={40} className="rounded-xl h-10 border-slate-200 w-full flex items-center" size="large" />
            </Form.Item>

            <Form.Item
              label="Tải lên bằng cấp / Chứng chỉ hành nghề"
            >
              <Upload 
                fileList={[
                  { uid: "1", name: "The_HDV_Quoc_Te.pdf", status: "done", url: "#" },
                  { uid: "2", name: "Chung_Chi_IELTS_7.5.pdf", status: "done", url: "#" }
                ]}
              >
                <Button icon={<UploadOutlined />} className="rounded-xl border-slate-200 text-slate-700 font-semibold text-xs h-9">
                  Tải tệp tin lên (PDF/Ảnh)
                </Button>
              </Upload>
            </Form.Item>

            <div className="flex justify-end border-t border-slate-100 pt-4 mt-2">
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={savingExpert}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold px-6 shadow-sm border-transparent"
                >
                  Lưu hồ sơ chuyên môn
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>
      )
    });
  } else if (userRole === "CONSULTANT" || userRole === "TOURPLANNER") {
    tabItems.push({
      key: "expertise",
      label: (
        <span className="flex items-center gap-2 py-1 font-bold text-xs uppercase tracking-wider">
          <SafetyCertificateOutlined /> Thiết lập Nghiệp vụ
        </span>
      ),
      children: (
        <Card title={<span className="font-black text-sm text-slate-800 uppercase tracking-wide">Hồ sơ nghiệp vụ nhân sự</span>} style={cardStyle}>
          <Alert 
            message="Thông báo bộ phận" 
            description={
              userRole === "CONSULTANT" 
                ? "Bộ phận tư vấn viên được cấu hình trực thuộc Chi nhánh TP. Hồ Chí Minh. Các yêu cầu Chat từ cổng hỗ trợ sẽ được phân phối tự động khi bạn Online."
                : "Bộ phận lập kế hoạch (Tour Planner) phụ trách thiết kế khuôn mẫu, điều hành phương tiện và phê duyệt năng lực cấp phép cho HDV du lịch."
            } 
            type="info" 
            showIcon 
            className="rounded-2xl"
          />
          <div className="mt-6 font-semibold text-slate-600 text-xs flex flex-col gap-3">
            <p>📍 <strong>Chi nhánh trực thuộc:</strong> Trụ sở chính iTour</p>
            <p>💼 <strong>Mã nhân viên:</strong> {userId?.substring(0, 8).toUpperCase()}</p>
            <p>🗓️ <strong>Ngày gia nhập:</strong> 15/04/2024</p>
          </div>
        </Card>
      )
    });
  }

  return (
    <div className="py-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-gears text-blue-600" />
          Thiết lập tài khoản (Account Settings)
        </h1>
        <p className="text-slate-500 mt-2">Cập nhật thông tin cá nhân, thiết lập cấu hình bảo mật và hồ sơ chuyên môn của bạn.</p>
      </div>

      {loadingProfile ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Tabs 
          tabPosition="left" 
          items={tabItems} 
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[500px]"
          tabBarStyle={{ borderRight: "1px solid #f1f5f9" }}
        />
      )}
    </div>
  );
}
