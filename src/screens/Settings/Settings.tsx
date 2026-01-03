import {useEffect, useState} from "react";
import {
    Save,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Sidebar } from "../../components/Sidebar";
import {getProfile } from "../../lib/checkPrivilege.ts";
import {UserProfile} from "../../lib/appModels.ts";
import {getAvatarProps} from "../../lib/utils.ts";
import {LoadingButton} from "../../components/feedback/LoadingButton.tsx";
import {
    changeLoginUserPassword,
    ChangePasswordRequest,
    fetchProfile,
    ProfileUpdateRequest,
    setAppInfo,
    updateProfile, uploadFileWithBase64
} from "../../lib/api.ts";
import {useToast} from "../../components/feedback/Toast.tsx";
import {password as passwordValidator} from "../../components/form/validators.ts";
import {FileUpload} from "../../components/upload/FileUpload.tsx";
import {Header} from "../../components/Header";

export const Settings = (): JSX.Element => {
  const { show } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);

    // NEW: error state
    const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    publicId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    picture: "",
    settings: {
        role: "",
        isEmailVerified: false,
    }
  });

    const nameOrEmail = `${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim() || profileData?.email;
    const { initials, bgClass, textClass } = getAvatarProps(nameOrEmail);

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field: string, value: string) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
      setSubmittingProfile(true);
      // console.log("Saving profile:", profileData);
      const id = profileData.publicId;
      const request: ProfileUpdateRequest = {
          profile: {
              firstName: profileData.firstName,
              middleName: profileData.middleName,
              lastName: profileData.lastName,
              email: profileData.email,
              phoneNumber: profileData.phone,
              profilePicture: profileData.picture,
              settings: profileData.settings
          }
      }

      try {
          const resp = await updateProfile(id, request);
          const update = resp?.data;
          if(update?.data) {
              const profileResp = await fetchProfile();
              const users = profileResp?.data;
              if(users) {
                  setAppInfo('profile', JSON.stringify(users?.data));
                  show({ title: "Profile Update successful", message: "The profile updated successfully.", type: "success" });
              }
              else {
                  show({ title: "Fetch Profile failed", message: "The profile fetching failed.", type: "error" });
              }
          }else {
              show({ title: "Profile Update failed", message: "The profile update failed.", type: "error" });
          }
      }catch (e) {
        show({ title: "Failed Profile Updating", message: "The profile could not be updated.", type: "error" });
      }finally {
          setSubmittingProfile(false);
      }
  };

  const handleSaveSecurity = async () => {
    if(!securityData.currentPassword.trim()) {
        show({ title: "Invalid Password", message: "Please enter your current password.", type: "error" });
        return;
    }
      setSubmittingPwd(true);
    const request: ChangePasswordRequest = {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
    }

    try {
        const resp = await changeLoginUserPassword(request);
        const passwd = resp?.data;
        if(passwd?.data) {
            show({ title: "Password Updated", message: "Your password has been updated successfully.", type: "success" });
            setSecurityData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        }else {
            show({ title: "Password Update failed", message: "The password update failed.", type: "error" });
        }
    }catch (e) {
        console.log(e);
        show({ title: "Failed Password Updating", message: "The password could not be updated.", type: "error" });
    }finally {
        setSubmittingPwd(false);
    }

  };

    // NEW: on-change validators
    const validateNewPassword = (value: string) => {
        const err = passwordValidator(8)(value);
        setNewPasswordError(err);
        // Also keep confirm in sync
        if (securityData.confirmPassword) {
            setConfirmPasswordError(value === securityData.confirmPassword ? null : "Passwords do not match");
        }
    };

    const validateConfirmPassword = (value: string, base: string) => {
        setConfirmPasswordError(value === base ? null : "Passwords do not match");
    };

  useEffect(() => {
      const user: UserProfile = getProfile();
      setProfileData({
          publicId: user?.publicId || "",
          firstName: user?.profile?.firstName || "",
          middleName: user?.profile?.middleName || "",
          lastName: user?.profile?.lastName || "",
          email: user?.profile?.email || "",
          phone: user?.profile?.phoneNumber || "",
          jobTitle: user?.profile?.settings?.role,
          picture: user?.profile?.profilePicture || "",
          settings: user?.profile?.settings || {}
      });
  }, [])

  // @ts-ignore
    return (
    <div className="flex min-h-screen bg-gray-5">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
          <Header title={"Settings"} />

        <div className="flex-1 p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-80 mb-2">
              Settings
            </h2>
            <p className="text-gray-60">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl border border-gray-20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-80">Profile Settings</h3>
                  <p className="text-sm text-gray-60">Update your personal information</p>
                </div>
                  <LoadingButton
                      type="button"
                      onClick={handleSaveProfile}
                      loading={submittingProfile}
                      className="bg-primary-500 hover:bg-primary-600 text-white h-10 px-4 rounded-lg"
                  >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                  </LoadingButton>
              </div>

              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center gap-4 p-4 bg-gray-5 rounded-lg">
                    <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center`}>
                        {(profileData?.picture) ? (
                                <span><img src={profileData?.picture} alt="Profile Picture" className="w-full h-full rounded-full"/></span>) :
                            (
                                <span className={`text-xs font-semibold ${textClass}`}>{initials}</span>
                            )
                        }
                    </div>
                  <div className="flex-1">
                      <FileUpload
                          label="Profile Picture"
                          description="JPG, PNG or GIF. Max size 1MB."
                          accept="image/*"
                          maxSizeBytes={1024 * 1024}
                          circularPreview
                          value={profileData.picture || null}
                          onChange={(url) => {
                              // Update state (and let the existing Save button persist it through updateProfile)
                              handleProfileChange('picture', url || '');
                          }}
                          // @ts-ignore
                          uploader={(file, onProgress) => uploadFileWithBase64(file, onProgress)}
                          className="max-w-sm"
                      />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                      First Name
                    </Label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange("firstName", e.target.value)}
                      className="h-10 bg-white border-gray-30 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                      Last Name
                    </Label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      className="h-10 bg-white border-gray-30 rounded-lg"
                    />
                  </div>
                </div>

               {/* Middle Name */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Middle Name
                  </Label>
                    <Input
                        value={profileData.middleName}
                        onChange={(e) => handleProfileChange("middleName", e.target.value)}
                        className="h-10 bg-white border-gray-30 rounded-lg"
                    />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="h-10 bg-white border-gray-30 rounded-lg"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Phone Number
                  </Label>
                  <div className="flex h-10 bg-white rounded-lg border border-gray-30">
                    <div className="inline-flex items-center gap-1.5 px-3 bg-gray-5 border-r border-gray-30 rounded-l-lg">
                      <span className="text-sm font-bold text-slate-600">+234</span>
                    </div>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      className="flex-1 border-0 bg-transparent rounded-r-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Job Title
                  </Label>
                  <Input
                    value={profileData.jobTitle}
                    disabled
                    onChange={(e) => handleProfileChange("jobTitle", e.target.value)}
                    className="h-10 bg-white border-gray-30 rounded-lg"
                  />
                </div>

              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl border border-gray-20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-80">Security Settings</h3>
                  <p className="text-sm text-gray-60">Update your password and security preferences</p>
                </div>
                  <LoadingButton
                      type="button"
                      onClick={handleSaveSecurity}
                      loading={submittingPwd}
                      className="bg-primary-500 hover:bg-primary-600 text-white h-10 px-4 rounded-lg"
                  >
                      <Save className="w-4 h-4 mr-2" />
                      Update
                  </LoadingButton>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) => handleSecurityChange("currentPassword", e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10 h-10 bg-white border-gray-30 rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      )}
                    </button>
                  </div>
                    <span className="text-xs text-red-600">
                        <strong>Note:</strong> Our current security policy will flag you as a
                        <strong>potential risk</strong> if your current password is wrong and will invalidate your login session.
                        If you forget your password, you will need to reset it.
                    </span>
                </div>

                {/* New Password */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    New Password
                  </Label>
                  <div className="relative">
                      <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={securityData.newPassword}
                          onChange={(e) => { handleSecurityChange("newPassword", e.target.value); validateNewPassword(e.target.value); }}
                          placeholder="Enter new password"
                          className="pr-10 h-10 bg-white border-gray-30 rounded-lg"
                          required
                          aria-invalid={!!newPasswordError}
                          aria-describedby="newPasswordError-error"
                      />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      )}
                    </button>
                  </div>
                    {newPasswordError && (
                        <p id="newPassword-error" className="text-sm text-red-600 mt-1">{newPasswordError}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="text-sm font-semibold text-gray-80 mb-2 block">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    {/*<Input*/}
                    {/*  type={showConfirmPassword ? "text" : "password"}*/}
                    {/*  value={securityData.confirmPassword}*/}
                    {/*  onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)}*/}
                    {/*  placeholder="Confirm new password"*/}
                    {/*  className="pr-10 h-10 bg-white border-gray-30 rounded-lg"*/}
                    {/*/>*/}
                      <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={securityData.confirmPassword}
                          onChange={(e) => { handleSecurityChange("confirmPassword", e.target.value); validateConfirmPassword(e.target.value, securityData.newPassword); }}
                          placeholder="Confirm new password"
                          className="pr-10 h-10 bg-white border-gray-30 rounded-lg"
                          required
                          aria-invalid={!!confirmPasswordError}
                          aria-describedby="confirmPasswordError-error"
                      />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-600 hover:text-gray-80 transition-colors" />
                      )}
                    </button>
                  </div>
                    {confirmPasswordError && (
                        <p id="confirmPasswordError-error" className="text-sm text-red-600 mt-1">{confirmPasswordError}</p>
                    )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-5 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-80 mb-3">Password Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-40 rounded-full"></div>
                      <span className="text-xs text-gray-60">At least 8 characters long</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-40 rounded-full"></div>
                      <span className="text-xs text-gray-60">Contains uppercase and lowercase letters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-40 rounded-full"></div>
                      <span className="text-xs text-gray-60">Contains at least one number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-40 rounded-full"></div>
                      <span className="text-xs text-gray-60">Contains at least one special character</span>
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="border-t border-gray-20 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gray-5 rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-80">Two-Factor Authentication</h4>
                      <p className="text-xs text-gray-60">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="twoFactor"
                        defaultChecked={true}
                        className="w-4 h-4 rounded border-gray-30 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                      />
                      <Label htmlFor="twoFactor" className="text-sm font-medium text-gray-80 cursor-pointer">
                        Enabled
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-gray-20 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-80 mb-2">Notification Settings</h3>
                <p className="text-sm text-gray-60">Choose how you want to be notified about important updates</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "email", title: "Email Notifications", description: "Receive notifications via email", enabled: true },
                  { id: "push", title: "Push Notifications", description: "Receive push notifications in browser", enabled: true },
                  { id: "sms", title: "SMS Notifications", description: "Receive notifications via SMS", enabled: false },
                  { id: "operators", title: "Operator Updates", description: "Get notified about operator changes", enabled: true },
                  { id: "revenue", title: "Revenue Alerts", description: "Get alerts for revenue milestones", enabled: true },
                  { id: "maintenance", title: "System Maintenance", description: "Notifications about system maintenance", enabled: true }
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-5 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-80">{notification.title}</h4>
                      <p className="text-xs text-gray-60">{notification.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Checkbox
                        id={notification.id}
                        defaultChecked={notification.enabled}
                        className="w-4 h-4 rounded border-gray-30 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                      />
                      <Label htmlFor={notification.id} className="text-xs font-medium text-gray-80 cursor-pointer">
                        {notification.enabled ? "On" : "Off"}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white h-10 px-6 rounded-lg">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};