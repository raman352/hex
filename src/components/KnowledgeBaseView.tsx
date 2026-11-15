import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { FaqCategory, FaqItem } from '../types';

export interface FaqActionResult {
  ok: boolean;
  error?: string;
}

interface KnowledgeBaseViewProps {
  faqs: FaqItem[];
  searchQueryExternal?: string;
  onAddFaq: (faq: Omit<FaqItem, 'id' | 'updatedAt'>) => FaqActionResult;
  onUpdateFaq: (id: string, updates: Omit<FaqItem, 'id' | 'updatedAt'>) => FaqActionResult;
  onDeleteFaq: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function KnowledgeBaseView({
  faqs,
  searchQueryExternal = '',
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
}: KnowledgeBaseViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | FaqCategory>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<FaqCategory>(FaqCategory.RETURNS);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveSearch = (searchQuery || searchQueryExternal).trim().toLowerCase();

  useEffect(() => {
    if (!isEditorOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      if (categoryFilter !== 'ALL' && faq.category !== categoryFilter) return false;
      if (!effectiveSearch) return true;
      return (
        faq.id.toLowerCase().includes(effectiveSearch) ||
        faq.question.toLowerCase().includes(effectiveSearch) ||
        faq.answer.toLowerCase().includes(effectiveSearch) ||
        faq.category.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [faqs, effectiveSearch, categoryFilter]);

  const openAddModal = () => {
    setEditingFaqId(null);
    setQuestion('');
    setAnswer('');
    setCategory(FaqCategory.RETURNS);
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingFaqId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setFormError('');
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || question.trim().length < 5) {
      setFormError('Please enter a clear FAQ question (at least 5 characters).');
      return;
    }
    if (!answer.trim() || answer.trim().length < 10) {
      setFormError('Please enter a helpful answer (at least 10 characters).');
      return;
    }

    const result = editingFaqId
      ? onUpdateFaq(editingFaqId, {
          question: question.trim(),
          answer: answer.trim(),
          category,
        })
      : onAddFaq({
          question: question.trim(),
          answer: answer.trim(),
          category,
        });

    if (!result.ok) {
      setFormError(result.error || 'Could not save FAQ entry.');
      return;
    }

    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#20283B]">
            Knowledge Base
          </h2>
          <p className="text-sm text-[#78849B] mt-1">
            Publish and update TechCare FAQs. DeskPilot AI uses these policies immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="saas-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Policy Sync Info Strip */}
      <div className="bg-[#EEF3FE] border border-[#DCE6FB] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#20283B]">
        <div className="flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 text-[#5486EA] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <span>
            <strong>Demonstration Policies:</strong> Saved locally and synced live with the Gemini AI customer chatbot.
          </span>
        </div>
        <span className="font-mono text-xs font-semibold text-[#5486EA] whitespace-nowrap tabular-nums">
          {faqs.length} Active Entries
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="saas-card rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#78849B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQ ID, questions, or answers..."
            className="saas-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
          />
        </div>

        <div className="bg-[#F4F6FC] border border-[#E6EBF5] flex items-center gap-1 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              categoryFilter === 'ALL'
                ? 'bg-white text-[#5486EA] shadow-xs'
                : 'text-[#78849B] hover:text-[#20283B]'
            }`}
          >
            All ({faqs.length})
          </button>
          {Object.values(FaqCategory).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'bg-white text-[#5486EA] shadow-xs'
                  : 'text-[#78849B] hover:text-[#20283B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Cards Grid */}
      {filteredFaqs.length === 0 ? (
        <div className="saas-card rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF3FE] text-[#5486EA] flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#20283B]">
            No knowledge base entries found
          </h3>
          <p className="text-sm text-[#78849B] max-w-md mx-auto">
            {faqs.length === 0
              ? 'Add your first FAQ entry so DeskPilot AI can answer customer questions accurately.'
              : 'Try adjusting your search query or category filter.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {(effectiveSearch || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                }}
                className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={openAddModal}
              className="saas-btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
            >
              Add FAQ
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.map((faq) => (
            <article
              key={faq.id}
              className="saas-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#78849B]">
                  <span className="font-mono font-semibold text-[#20283B] tabular-nums">
                    {faq.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#8B72E8]">{faq.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Updated {formatDate(faq.updatedAt)}</span>
                </div>
                <h3 className="text-base font-semibold text-[#20283B] leading-snug">
                  {faq.question}
                </h3>
                <p className="text-sm text-[#5D6982] leading-relaxed">{faq.answer}</p>
              </div>

              <div className="pt-3 border-t border-[#EDF1FA] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(faq)}
                  className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#20283B] hover:text-[#5486EA] rounded-xl"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit</span>
                </button>

                {confirmDeleteId === faq.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteFaq(faq.id);
                        setConfirmDeleteId(null);
                      }}
                      className="saas-btn-danger px-3 py-1.5 text-xs font-semibold rounded-xl"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="saas-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(faq.id)}
                    className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EF747C] rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#20283B]/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <div className="bg-white rounded-3xl border border-[#E6EBF5] shadow-[0_24px_60px_rgba(32,40,59,0.18)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[#EDF1FA] flex items-center justify-between shrink-0">
              <h2 id="faq-modal-title" className="text-lg font-bold text-[#20283B]">
                {editingFaqId ? 'Edit FAQ Entry' : 'Add New FAQ Entry'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-9 h-9 rounded-xl border border-[#E6EBF5] hover:bg-[#F4F6FC] flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
                aria-label="Close FAQ editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] p-3.5 rounded-2xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="faq-category"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Category
                </label>
                <select
                  id="faq-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FaqCategory)}
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                >
                  {Object.values(FaqCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="faq-question"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Question <span className="text-[#EF747C]">*</span>
                </label>
                <input
                  id="faq-question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Do you offer cash-on-delivery (COD) orders?"
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                />
              </div>

              <div>
                <label
                  htmlFor="faq-answer"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Answer <span className="text-[#EF747C]">*</span>
                </label>
                <textarea
                  id="faq-answer"
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide accurate policy or product details that the AI agent should share..."
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-2xl resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-btn-primary px-5 py-2 text-xs font-semibold rounded-xl"
                >
                  {editingFaqId ? 'Save Changes' : 'Publish FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
