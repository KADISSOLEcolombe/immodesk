"use client";

import Image from 'next/image';
import { useState } from 'react';

interface PropertyGalleryProps {
  title: string;
  images: string[];
}

export default function PropertyGallery({ title, images }: PropertyGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0] || '/window.svg');

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100">
        <Image
          src={activeImage}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(img)}
              className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                activeImage === img ? 'border-zinc-900 ring-2 ring-zinc-900/20' : 'border-transparent hover:border-zinc-300'
              }`}
            >
              <Image
                src={img}
                alt={`${title} view ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}