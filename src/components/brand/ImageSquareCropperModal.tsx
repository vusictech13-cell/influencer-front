import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Loader2, X, ZoomIn } from 'lucide-react';
import { getCroppedImageBlob } from '@/utils/cropImage';

type ImageSquareCropperModalProps = {
    imageSrc: string;
    open: boolean;
    title?: string;
    onClose: () => void;
    onConfirm: (blob: Blob) => Promise<void>;
};

export default function ImageSquareCropperModal({
    imageSrc,
    open,
    title = 'Crop Image',
    onClose,
    onConfirm,
}: ImageSquareCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setProcessing(true);
        try {
            const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
            await onConfirm(blob);
            onClose();
        } finally {
            setProcessing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                <div className="relative h-72 bg-gray-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <ZoomIn size={14} className="text-gray-400 shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-[#00B4EB]"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={processing}
                            className="flex-1 py-2.5 text-sm font-semibold bg-[#00B4EB] text-gray-900 rounded-xl hover:bg-[#009fd4] disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {processing ? <Loader2 size={16} className="animate-spin" /> : null}
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
