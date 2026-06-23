import { useState, useRef } from 'react'
import { useAuth } from '../lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import PageTransition from '../components/ui/page-transition'
import { 
  User as UserIcon, Lock, Camera, CheckCircle, AlertCircle, Loader2, Key
} from 'lucide-react'

export default function Profile() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef()

  // Profile fields state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  
  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Status messages
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })
  const [avatarMsg, setAvatarMsg] = useState({ type: '', text: '' })

  const clearMessages = () => {
    setProfileMsg({ type: '', text: '' })
    setPasswordMsg({ type: '', text: '' })
    setAvatarMsg({ type: '', text: '' })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    clearMessages()
    setUpdatingProfile(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    clearMessages()

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setUpdatingPassword(true)

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearMessages()

    // Client-side validations
    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'Please select an image file.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Avatar must be under 2MB.' })
      return
    }

    setUploadingAvatar(true)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch('/api/auth/avatar', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
        setAvatarMsg({ type: 'success', text: 'Avatar updated successfully!' })
      } else {
        setAvatarMsg({ type: 'error', text: data.message || 'Failed to upload avatar' })
      }
    } catch {
      setAvatarMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <PageTransition>
      <div className="w-full space-y-8 pb-16">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile details, avatar, and password.</p>
        </div>

        {/* Top Profile Summary Panel */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Selector Wrapper */}
              <div className="relative group shrink-0">
                <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-primary/20 bg-secondary flex items-center justify-center font-bold text-4xl text-primary shadow-inner">
                  {uploadingAvatar ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <span>{user?.name ? user.name[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                
                {/* Upload Hover Button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-not-allowed text-white gap-1"
                  aria-label="Change profile photo"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="text-center sm:text-left space-y-1.5 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">{user?.name}</h2>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold">
                  Active account
                </div>
                {avatarMsg.text && (
                  <div className={`text-xs mt-2 flex items-center justify-center sm:justify-start gap-1 font-medium ${
                    avatarMsg.type === 'success' ? 'text-emerald-500' : 'text-destructive'
                  }`}>
                    {avatarMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {avatarMsg.text}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dual pane forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile details card */}
          <Card className="border border-border bg-card shadow-sm flex flex-col">
            <CardHeader className="border-b border-border/50 py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" /> Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {profileMsg.text && (
                  <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-sm ${
                    profileMsg.type === 'success' 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-destructive/5 border-destructive/10 text-destructive'
                  }`}>
                    {profileMsg.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updatingProfile} 
                    className="gap-1.5 w-full sm:w-auto"
                  >
                    {updatingProfile ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change password card */}
          <Card className="border border-border bg-card shadow-sm flex flex-col">
            <CardHeader className="border-b border-border/50 py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleChangePassword} className="space-y-5">
                {passwordMsg.text && (
                  <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-sm ${
                    passwordMsg.type === 'success' 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-destructive/5 border-destructive/10 text-destructive'
                  }`}>
                    {passwordMsg.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="current-pwd">Current Password</Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updatingPassword} 
                    className="gap-1.5 w-full sm:w-auto"
                  >
                    {updatingPassword ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
