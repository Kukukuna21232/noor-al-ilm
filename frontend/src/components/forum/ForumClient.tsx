'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Eye, Plus, Search, TrendingUp, Clock, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { forumApi } from '@/lib/api';
import { useDebounce } from '@/hooks';
import { Button, Input, Textarea, Select, EmptyState, Skeleton, Badge } from '@/components/ui';
import { CATEGORY_COLORS, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import type { ForumPost, ForumCategory } from '@/types';

const postSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(500),
  content: z.string().min(10, 'المحتوى يجب أن يكون 10 أحرف على الأقل'),
  category: z.string().min(1, 'اختر تصنيفاً'),
});
type PostFormData = z.infer<typeof postSchema>;

export default function ForumClient() {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState<'recent' | 'trending'>('recent');
  const [search, setSearch] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data: categoriesData } = useQuery({ queryKey: ['forum-categories'], queryFn: () => forumApi.getCategories(), staleTime: Infinity });
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['forum-posts', { category: activeCategory, sort, search: debouncedSearch }],
    queryFn: () => forumApi.getPosts({ ...(activeCategory !== 'all' && { category: activeCategory }), sort, ...(debouncedSearch && { search: debouncedSearch }) }),
    staleTime: 30_000,
  });

  const categories: ForumCategory[] = (categoriesData as { categories?: ForumCategory[] })?.categories || [];
  const posts: ForumPost[] = (postsData as { posts?: ForumPost[] })?.posts || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PostFormData>({ resolver: zodResolver(postSchema) });

  const createPostMutation = useMutation({
    mutationFn: (data: PostFormData) => forumApi.createPost({ title: data.title, content: data.content, category: data.category }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم نشر الموضوع' : 'Post published');
      reset(); setShowNewPost(false);
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: () => toast.error(locale === 'ar' ? 'فشل نشر الموضوع' : 'Failed to publish'),
  });

  const categoryOptions = categories.map(c => ({ value: c.slug, label: locale === 'ar' ? c.name : (c.nameRu || c.name) }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-14 geometric-bg">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white arabic-text mb-3">{t('forum.title')}</h1>
            <p className="text-gray-400 arabic-text">{locale === 'ar' ? 'تبادل المعرفة والخبرات مع المجتمع الإسلامي' : 'Share knowledge with the Islamic community'}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-5">
            {isAuthenticated && (
              <Button onClick={() => setShowNewPost(!showNewPost)} className="w-full justify-center arabic-text">
                <Plus className="w-4 h-4" />{t('forum.newPost')}
              </Button>
            )}

            {/* New post form */}
            {showNewPost && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground arabic-text mb-4">{t('forum.newPost')}</h3>
                <form onSubmit={handleSubmit(d => createPostMutation.mutate(d))} className="space-y-3">
                  <Input {...register('title')} label={locale === 'ar' ? 'العنوان' : 'Title'} placeholder={locale === 'ar' ? 'عنوان الموضوع' : 'Post title'} error={errors.title?.message} />
                  <Textarea {...register('content')} label={locale === 'ar' ? 'المحتوى' : 'Content'} rows={4} placeholder={locale === 'ar' ? 'اكتب موضوعك هنا...' : 'Write your post...'} error={errors.content?.message} />
                  <Select {...register('category')} label={locale === 'ar' ? 'التصنيف' : 'Category'} options={categoryOptions} placeholder={locale === 'ar' ? 'اختر تصنيفاً' : 'Select category'} error={errors.category?.message} />
                  <div className="flex gap-2">
                    <Button type="submit" loading={createPostMutation.isPending} size="sm" className="flex-1 justify-center arabic-text">{t('common.submit')}</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewPost(false)} className="arabic-text">{t('common.cancel')}</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Categories */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-foreground arabic-text mb-3 text-sm">{t('forum.categories')}</h3>
              <div className="space-y-1">
                <button onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all arabic-text ${activeCategory === 'all' ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 font-medium' : 'hover:bg-muted text-muted-foreground'}`}>
                  <span>{locale === 'ar' ? 'الكل' : 'All'}</span>
                  <span className="badge bg-muted text-muted-foreground text-xs">{posts.length}</span>
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all arabic-text ${activeCategory === cat.slug ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 font-medium' : 'hover:bg-muted text-muted-foreground'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{locale === 'ar' ? cat.name : (cat.nameRu || cat.name)}</span>
                    </div>
                    <span className="badge bg-muted text-muted-foreground text-xs">{cat.postCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-3 space-y-4">
            {/* Search & sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="input-field pr-10 arabic-text" />
              </div>
              <div className="flex gap-2">
                {[{ key: 'recent', icon: Clock, label_ar: 'الأحدث', label_ru: 'Новые' }, { key: 'trending', icon: TrendingUp, label_ar: 'الأكثر تداولاً', label_ru: 'Популярные' }].map(s => (
                  <button key={s.key} onClick={() => setSort(s.key as 'recent' | 'trending')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all arabic-text ${sort === s.key ? 'bg-primary-600 text-white' : 'bg-card border border-border hover:bg-muted'}`}>
                    <s.icon className="w-3.5 h-3.5" />{locale === 'ar' ? s.label_ar : s.label_ru}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
            ) : posts.length === 0 ? (
              <EmptyState icon={<MessageSquare className="w-8 h-8" />} title={locale === 'ar' ? 'لا توجد مواضيع' : 'No posts found'} />
            ) : (
              posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/forum/${post.id}`}
                    className="block bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary-300 transition-all duration-300 group">
                    {post.isPinned && <div className="flex items-center gap-1 text-gold-600 text-xs mb-2 arabic-text"><span>📌</span><span>{locale === 'ar' ? 'مثبت' : 'Pinned'}</span></div>}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                        {post.authorName?.charAt(0) || 'م'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {post.categoryName && <span className={`badge text-xs ${CATEGORY_COLORS[post.categorySlug || ''] || CATEGORY_COLORS.general}`}>{post.categoryName}</span>}
                          {post.authorRole && post.authorRole !== 'user' && <span className={`badge text-xs ${ROLE_COLORS[post.authorRole]}`}>{ROLE_LABELS[post.authorRole]}</span>}
                        </div>
                        <h3 className="font-bold text-foreground arabic-text group-hover:text-primary-600 transition-colors line-clamp-2">{post.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="arabic-text">{post.authorName}</span>
                          <span>·</span>
                          <span className="arabic-text">{(post as ForumPost & { time?: string }).time || ''}</span>
                          {post.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 text-primary-600"><Tag className="w-3 h-3" />{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /><span>{post.repliesCount}</span></div>
                          <div className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /><span>{post.likesCount}</span></div>
                          <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /><span>{post.viewsCount}</span></div>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
