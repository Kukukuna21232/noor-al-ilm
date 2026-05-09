'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, Reply, Send } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { videoApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function CommentSection({ videoId, commentCount }: { videoId: string; commentCount: number }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['comments', videoId], queryFn: () => videoApi.getComments(videoId) });

  const addMutation = useMutation({
    mutationFn: (content: string) => videoApi.addComment(videoId, content),
    onSuccess: () => { setNewComment(''); qc.invalidateQueries({ queryKey: ['comments', videoId] }); toast.success('تم إضافة التعليق'); },
    onError: () => toast.error('فشل إضافة التعليق'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId: string }) => videoApi.addComment(videoId, content, parentId),
    onSuccess: () => { setReplyText(''); setReplyingTo(null); qc.invalidateQueries({ queryKey: ['comments', videoId] }); },
  });

  const comments = (data as { comments: Record<string, unknown>[] })?.comments || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-foreground arabic-text">التعليقات ({commentCount?.toLocaleString('ar-SA') || 0})</h3>
      </div>

      {user ? (
        <form onSubmit={e => { e.preventDefault(); if (newComment.trim()) addMutation.mutate(newComment.trim()); }} className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user.name?.charAt(0) || 'م'}
          </div>
          <div className="flex-1 flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="أضف تعليقاً..." className="input-field flex-1 arabic-text text-sm" maxLength={2000} />
            <button type="submit" disabled={!newComment.trim() || addMutation.isPending} className="btn-primary !px-4 !py-2 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground text-sm arabic-text">
            <a href="/auth/login" className="text-primary-600 hover:underline">سجّل الدخول</a> للمشاركة في النقاش
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-3 bg-muted rounded w-1/4" /><div className="h-4 bg-muted rounded w-3/4" /></div>
          </div>
        ))}</div>
      ) : (
        <AnimatePresence>
          <div className="space-y-5">
            {comments.map((c) => (
              <motion.div key={c.id as string} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(c.user_name as string)?.charAt(0) || 'م'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground arabic-text">{c.user_name as string}</span>
                    {c.user_role === 'teacher' && <span className="badge bg-green-100 text-green-700 text-xs">معلم</span>}
                    {c.user_role === 'admin' && <span className="badge bg-red-100 text-red-700 text-xs">مدير</span>}
                    <span className="text-xs text-muted-foreground">
                      {c.created_at ? formatDistanceToNow(new Date(c.created_at as string), { addSuffix: true, locale: ar }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-foreground arabic-text leading-relaxed">{c.content as string}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" /><span>{c.likes_count as number || 0}</span>
                    </button>
                    {user && (
                      <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id as string)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 transition-colors arabic-text">
                        <Reply className="w-3.5 h-3.5" />رد
                      </button>
                    )}
                  </div>
                  {replyingTo === c.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mt-3">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="اكتب ردك..." className="input-field flex-1 text-sm arabic-text" autoFocus />
                      <button onClick={() => replyMutation.mutate({ content: replyText.trim(), parentId: c.id as string })} disabled={!replyText.trim()} className="btn-primary !px-3 !py-2 disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground arabic-text">كن أول من يعلّق!</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
