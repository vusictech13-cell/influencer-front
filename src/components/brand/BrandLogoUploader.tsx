import { useRef, useState } from 'react';
import { message } from 'antd';
import { UploadCloud, Loader2, X } from 'lucide-react';
import ImageSquareCropperModal from './ImageSquareCropperModal';
import { useUploadCampaignImage } from '@/hooks/useImageUpload';
import {
    ACCEPTED_IMAGE_EXTENSIONS,
    MAX_IMAGE_SIZE_MB,
    getUploadErrorMessage,
    resolveAssetUrl,
    validateImageFile,
} from '@/utils/image';

type BrandLogoUploaderProps = {
    value?: string;
    onChange: (url: string) => void;
};

export default function BrandLogoUploader({ value, onChange }: BrandLogoUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropOpen, setCropOpen] = useState(false);
    const { mutateAsync: uploadImage, isPending } = useUploadCampaignImage();

    const previewUrl = value ? resolveAssetUrl(value) : '';

    const handleFileSelect = (file: File) => {
        const error = validateImageFile(file);
        if (error) {
            message.error(error);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setCropSrc(objectUrl);
        setCropOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    const handleCropConfirm = async (blob: Blob) => {
        try {
            const result = await uploadImage({ file: blob, type: 'brand_logo' });
            onChange(result.url);
            message.success('Brand logo uploaded');
        } catch (error: unknown) {
            message.error(getUploadErrorMessage(error));
            throw error;
        } finally {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
        }
    };

    const handleCloseCropper = () => {
        setCropOpen(false);
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_IMAGE_EXTENSIONS}
                className="hidden"
                onChange={handleInputChange}
            />

            {previewUrl ? (
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        <img src={previewUrl} alt="Brand logo" className="w-full h-full object-cover" />
                    </div>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isPending}
                        className="text-xs font-medium text-[#00B4EB] hover:underline"
                    >
                        Change
                    </button>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="p-1 text-gray-400 hover:text-[#FF5A5F]"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isPending}
                    className="w-full h-11 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-[#00B4EB]/50 cursor-pointer transition-colors gap-2"
                >
                    {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <UploadCloud size={14} />
                    )}
                    {isPending ? 'Uploading...' : 'Upload Logo'}
                </button>
            )}

            <p className="text-[10px] text-gray-400 mt-1">Square crop • Max {MAX_IMAGE_SIZE_MB}MB • JPG, PNG, WEBP</p>

            {cropSrc && (
                <ImageSquareCropperModal
                    imageSrc={cropSrc}
                    open={cropOpen}
                    title="Crop Brand Logo"
                    onClose={handleCloseCropper}
                    onConfirm={handleCropConfirm}
                />
            )}
        </>
    );
}
