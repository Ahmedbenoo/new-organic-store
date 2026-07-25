"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import type { BlogData, BlogPageSettings, BlogPostRecord } from "@/lib/types";

function createEmptyPost(sortOrder: number): BlogPostRecord {
  const date = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  return {
    id: `post-${Date.now()}`,
    title_ar: "مقال جديد",
    title_en: "New post",
    excerpt_ar: "",
    excerpt_en: "",
    content_ar: "",
    content_en: "",
    image_url: "/assets/img1.jpeg",
    emoji: "📝",
    date,
    read_time: 5,
    active: true,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
}

export default function AdminBlog() {
  const [settings, setSettings] = useState<BlogPageSettings | null>(null);
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBlog() {
      setLoading(true);

      try {
        const response = await fetch("/api/blog?all=true");
        const payload = (await response.json()) as BlogData;

        if (!cancelled && response.ok) {
          setSettings(payload.settings);
          setPosts(payload.posts ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBlog();

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function updateSettingsField(key: keyof BlogPageSettings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updatePost(id: string, patch: Partial<BlogPostRecord>) {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...patch } : post)),
    );
  }

  function movePost(id: string, direction: "up" | "down") {
    setPosts((prev) => {
      const index = prev.findIndex((post) => post.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next.map((post, postIndex) => ({
        ...post,
        sort_order: postIndex + 1,
      }));
    });
  }

  function addPost() {
    setPosts((prev) => [...prev, createEmptyPost(prev.length + 1)]);
    setEditingId(null);
  }

  function removePost(id: string) {
    if (!window.confirm("Delete this blog post?")) return;

    setPosts((prev) =>
      prev
        .filter((post) => post.id !== id)
        .map((post, index) => ({ ...post, sort_order: index + 1 })),
    );
    setEditingId((current) => (current === id ? null : current));
  }

  async function saveBlog() {
    if (!settings) return;
    setSaving(true);

    try {
      const response = await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, posts }),
      });

      if (!response.ok) {
        showToast("Error saving blog");
        return;
      }

      const payload = (await response.json()) as BlogData;
      setSettings(payload.settings);
      setPosts(payload.posts);
      showToast("Blog saved!");
    } catch {
      showToast("Error saving blog");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading blog...</div>;
  }

  if (!settings) {
    return <div className="py-12 text-center text-gray-400">Failed to load blog.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog</h2>
          <p className="text-sm text-gray-500">
            Manage blog page content and posts in Arabic and English.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href="/ar/blog"
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
          >
            Preview blog
          </a>
          <button
            type="button"
            onClick={addPost}
            className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 sm:w-auto"
          >
            + Add Post
          </button>
          <button
            type="button"
            onClick={saveBlog}
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Blog"}
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:mx-0 sm:text-start">
          {toast}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-700">Blog page header</h3>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {(
            [
              ["title_ar", "Page title (Arabic)"],
              ["title_en", "Page title (English)"],
              ["description_ar", "Page description (Arabic)"],
              ["description_en", "Page description (English)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="text"
                dir={key.endsWith("_ar") ? "rtl" : "ltr"}
                value={settings[key]}
                onChange={(event) => updateSettingsField(key, event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-gray-700">No blog posts yet</p>
          <button
            type="button"
            onClick={addPost}
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Add first post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const isEditing = editingId === post.id;

            return (
              <div
                key={post.id}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  post.active ? "border-gray-200" : "border-gray-100 opacity-70"
                }`}
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                  <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-amber-50 sm:w-44">
                    <Image
                      src={post.image_url || "/assets/img1.jpeg"}
                      alt={post.title_en}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="176px"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        #{index + 1}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        /blog/{post.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePost(post.id, { active: !post.active })}
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          post.active
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {post.active ? "Published" : "Hidden"}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Slug (URL id)
                        </label>
                        <input
                          type="text"
                          value={post.id}
                          onChange={(event) =>
                            updatePost(post.id, {
                              id: event.target.value
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, "-"),
                            })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Emoji
                        </label>
                        <input
                          type="text"
                          value={post.emoji}
                          onChange={(event) =>
                            updatePost(post.id, { emoji: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Title (Arabic)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={post.title_ar}
                          onChange={(event) =>
                            updatePost(post.id, { title_ar: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Title (English)
                        </label>
                        <input
                          type="text"
                          value={post.title_en}
                          onChange={(event) =>
                            updatePost(post.id, { title_en: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Date
                        </label>
                        <input
                          type="date"
                          value={post.date}
                          onChange={(event) =>
                            updatePost(post.id, { date: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Read time (minutes)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={post.read_time}
                          onChange={(event) =>
                            updatePost(post.id, {
                              read_time: Number(event.target.value) || 1,
                            })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Excerpt (Arabic)
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          value={post.excerpt_ar}
                          onChange={(event) =>
                            updatePost(post.id, { excerpt_ar: event.target.value })
                          }
                          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Excerpt (English)
                        </label>
                        <textarea
                          rows={2}
                          value={post.excerpt_en}
                          onChange={(event) =>
                            updatePost(post.id, { excerpt_en: event.target.value })
                          }
                          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Content (Arabic)
                        </label>
                        <textarea
                          rows={5}
                          dir="rtl"
                          value={post.content_ar}
                          onChange={(event) =>
                            updatePost(post.id, { content_ar: event.target.value })
                          }
                          className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Content (English)
                        </label>
                        <textarea
                          rows={5}
                          value={post.content_en}
                          onChange={(event) =>
                            updatePost(post.id, { content_en: event.target.value })
                          }
                          className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => movePost(post.id, "up")}
                        disabled={index === 0}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => movePost(post.id, "down")}
                        disabled={index === posts.length - 1}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : post.id)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {isEditing ? "Close image picker" : "Change image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePost(post.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    {isEditing ? (
                      <ImagePicker
                        label="Post cover image"
                        value={post.image_url}
                        onChange={(image_url) => updatePost(post.id, { image_url })}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
