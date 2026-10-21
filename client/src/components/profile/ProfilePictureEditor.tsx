import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Check, X, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { avatarService } from '../../services/avatarService';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface ProfilePictureEditorProps {
  className?: string;
  onAvatarUpdated?: () => void;
}

export const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  className = '',
  onAvatarUpdated,
}) => {
  const { user, updateUser, refreshUser } = useAuth();
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, or WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Selected image exceeds the 5 MB maximum file size.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updatedUser = await avatarService.uploadAvatar(selectedFile);
      updateUser(updatedUser);
      handleCancelPreview();
      showSuccess(t('avatar.uploadSuccess'));
      onAvatarUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const handleRemovePhoto = async () => {
    setIsRemoving(true);
    setErrorMessage(null);

    try {
      const updatedUser = await avatarService.removeAvatar();
      updateUser(updatedUser);
      await refreshUser();
      handleCancelPreview();
      setIsConfirmingRemove(false);
      showSuccess(t('avatar.removeSuccess'));
      onAvatarUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove custom picture.');
    } finally {
      setIsRemoving(false);
    }
  };

  const hasCustom = Boolean(user?.hasCustomAvatar);
  const hasGoogle = Boolean(user?.googleAvatarUrl);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 ${className}`}>
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar Display / Preview */}
        <div className="relative group shrink-0">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="w-28 h-28 rounded-full object-cover border-4 border-brand-500 shadow-md animate-in fade-in"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                {t('avatar.previewTitle')}
              </span>
            </div>
          ) : (
            <div className="relative">
              <Avatar
                src={user?.avatarUrl}
                name={user?.name || 'User'}
                size="2xl"
                className="shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                title={t('avatar.changePhoto')}
                aria-label={t('avatar.changePhoto')}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content & Actions */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base font-bold text-slate-900">{t('avatar.title')}</h3>
            {hasCustom ? (
              <Badge variant="teal" size="sm" icon={<Sparkles className="w-3 h-3 text-teal-600" />}>
                {t('avatar.customPhotoBadge')}
              </Badge>
            ) : hasGoogle ? (
              <Badge variant="primary" size="sm">
                {t('avatar.googlePhotoBadge')}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                {t('avatar.defaultPhotoBadge')}
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 max-w-md">
            {t('avatar.formatsNotice')}
          </p>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Upload profile image"
          />

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            {previewUrl ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePhoto}
                  disabled={isSaving}
                  icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : t('avatar.savePhoto')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPreview}
                  disabled={isSaving}
                  icon={<X className="w-4 h-4" />}
                >
                  {t('avatar.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="w-4 h-4 text-brand-600" />}
                >
                  {t('avatar.changePhoto')}
                </Button>

                {hasCustom && (
                  isConfirmingRemove ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={isRemoving}
                        icon={isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      >
                        {isRemoving ? 'Removing...' : 'Confirm Remove'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsConfirmingRemove(false)}
                        disabled={isRemoving}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsConfirmingRemove(true)}
                      disabled={isRemoving}
                      icon={<Trash2 className="w-4 h-4" />}
                      className="bg-transparent text-rose-600 border border-rose-200 hover:bg-rose-50"
                    >
                      {t('avatar.removePhoto')}
                    </Button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
