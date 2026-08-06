"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminLabels } from "@/lib/admin-labels";

type ImagePickerProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImagePicker({
  value,
  onChange,
  label = adminLabels.imagePicker.defaultLabel,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      setLoadingImages(true);

      try {
        const response = await fetch("/api/media");
        const payload = (await response.json()) as { images?: string[] };

        if (!cancelled && response.ok) {
          setImages(payload.images ?? []);
        }
      } finally {
        if (!cancelled) setLoadingImages(false);
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredImages = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) => image.toLowerCase().includes(query));
  }, [images, pickerSearch]);

  async function handleUpload(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        window.alert(payload.error ?? adminLabels.imagePicker.uploadFailed);
        return;
      }

      setImages((prev) =>
        [...prev, payload.url!].sort((a, b) => a.localeCompare(b)),
      );
      onChange(payload.url);
    } catch {
      window.alert(adminLabels.imagePicker.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative mx-auto h-48 w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white">
          {value ? (
            <Image
              src={value}
              alt={adminLabels.imagePicker.selectedImage}
              fill
              unoptimized
              className="object-cover"
              sizes="320px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {adminLabels.imagePicker.noImageSelected}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {adminLabels.imagePicker.imageUrl}
        </label>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/assets/img1.jpeg"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          {uploading ? adminLabels.imagePicker.uploading : adminLabels.imagePicker.uploadNew}
        </button>
        <input
          type="search"
          value={pickerSearch}
          onChange={(event) => setPickerSearch(event.target.value)}
          placeholder={adminLabels.imagePicker.searchGallery}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
      </div>

      {loadingImages ? (
        <p className="text-sm text-gray-500">{adminLabels.imagePicker.loadingGallery}</p>
      ) : filteredImages.length === 0 ? (
        <p className="text-sm text-gray-500">{adminLabels.imagePicker.noImagesFound}</p>
      ) : (
        <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5 md:grid-cols-6">
          {filteredImages.map((image) => {
            const selected = value === image;

            return (
              <button
                key={image}
                type="button"
                onClick={() => onChange(image)}
                title={image}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                  selected
                    ? "border-amber-500 ring-2 ring-amber-200"
                    : "border-transparent hover:border-amber-300"
                }`}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
