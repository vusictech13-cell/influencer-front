import { useRef, useState } from 'react';
import { message } from 'antd';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { useUploadCampaignImage } from '@/hooks/useImageUpload';
import {
    ACCEPTED_IMAGE_EXTENSIONS,
    MAX_IMAGE_SIZE_MB,
    getUploadErrorMessage,
    resolveAssetUrl,
    validateImageFile,
} from '@/utils/image';

type TrackArtworkUploaderProps = {
    value?: string;
    onChange: (url: string) => void;
};

export default function TrackArtworkUploader({ value, onChange }: TrackArtworkUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const { mutateAsync: uploadImage, isPending } = useUploadCampaignImage();

    const previewUrl = value ? resolveAssetUrl(value) : '';

    const uploadFile = async (file: File) => {
        const error = validateImageFile(file);
        if (error) {
            message.error(error);
            return;
        }

        try {
            const result = await uploadImage({ file, type: 'track_artwork' });
            onChange(result.url);
            message.success('Track artwork uploaded');
        } catch (err: unknown) {
            message.error(getUploadErrorMessage(err));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_IMAGE_EXTENSIONS}
                className="hidden"
                onChange={handleInputChange}
            />

            <div
                role="button"
                tabIndex={0}
                onClick={() => !isPending && inputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-colors overflow-hidden ${
                    dragOver
                        ? 'border-[#00B4EB] bg-[#00B4EB]/5'
                        : 'border-gray-200 bg-gray-50/50 hover:border-[#00B4EB]/50'
                } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
            >
                {previewUrl ? (
                    <>
                        <img src={previewUrl} alt="Track artwork" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-semibold">Click to replace</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-gray-600 hover:text-[#FF5A5F] z-10"
                        >
                            <X size={14} />
                        </button>
                    </>
                ) : isPending ? (
                    <>
                        <Loader2 size={20} className="animate-spin text-[#00B4EB] mb-2" />
                        <span className="text-gray-500">Uploading & compressing...</span>
                    </>
                ) : (
                    <>
                        <ImageIcon size={20} className="mb-2 text-gray-400" />
                        <span className="text-gray-500">Click or drag image to upload</span>
                    </>
                )}
            </div>

            <p className="text-[10px] text-gray-400 mt-1">Max {MAX_IMAGE_SIZE_MB}MB • JPG, PNG, WEBP • Auto-resized on upload</p>
        </div>
    );
}
