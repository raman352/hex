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
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (categoryFilter !== 'ALL' && faq.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        faq.id.toLowerCase().includes(q) ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q)
      );
    });
  }, [faqs, searchQuery, categoryFilter]);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29384A]">
            Knowledge Base Management
          </h1>
          <p className="text-sm text-[#5B6C82] mt-1">
            Add, edit, or remove FAQs. The DeskPilot AI chatbot immediately uses these entries when answering customers.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="neu-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Clear Demonstration Policies Label */}
      <div className="neu-inset-sm rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#29384A]">
        <div className="flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 text-[#548BCB] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <span>
            <strong>Demonstration Policies:</strong> These TechCare FAQs are fictional demonstration policies stored in your browser&apos;s localStorage and immediately control how DeskPilot AI answers policy questions.
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold text-[#548BCB] whitespace-nowrap">
          {faqs.length} Active Entries
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="neu-surface rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#5B6C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQ ID, questions, or answers..."
            className="neu-inset-sm w-full pl-10 pr-4 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
          />
        </div>

        <div className="neu-inset-sm flex items-center gap-1 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
              categoryFilter === 'ALL'
                ? 'neu-surface-sm text-[#548BCB]'
                : 'text-[#5B6C82] hover:text-[#29384A]'
            }`}
          >
            All ({faqs.length})
          </button>
          {Object.values(FaqCategory).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
                categoryFilter === cat
                  ? 'neu-surface-sm text-[#548BCB]'
                  : 'text-[#5B6C82] hover:text-[#29384A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Cards */}
      {filteredFaqs.length === 0 ? (
        <div className="neu-surface rounded-3xl p-10 text-center space-y-3">
          <div className="neu-surface-bright w-12 h-12 rounded-2xl text-[#548BCB] flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#29384A]">
            No knowledge base entries found
          </h2>
          <p className="text-sm text-[#5B6C82] max-w-md mx-auto">
            {faqs.length === 0
              ? 'Add your first FAQ entry so DeskPilot can answer customer questions accurately.'
              : 'Try adjusting your search or category filter.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {(searchQuery || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                }}
                className="neu-btn px-4 py-2.5 text-sm font-semibold rounded-xl"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={openAddModal}
              className="neu-btn-primary px-4 py-2.5 text-sm font-semibold rounded-xl"
            >
              Add FAQ
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFaqs.map((faq) => (
            <article key={faq.id} className="neu-surface rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6C82]">
                    <span className="font-mono font-bold text-[#29384A] tabular-nums">
                      {faq.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#548BCB]">{faq.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Updated {formatDate(faq.updatedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] font-medium text-[#5B6C82]">
                      Demo Policy
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#29384A]">
                    {faq.question}
                  </h2>
                  <p className="text-sm text-[#5B6C82] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(faq)}
                    className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#29384A] hover:text-[#548BCB] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
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
                        className="neu-btn-danger px-3 py-2 text-xs font-semibold rounded-xl"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="neu-btn px-3 py-2 text-xs font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(faq.id)}
                      className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#B83B3B] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29384A]/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <div className="neu-surface rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between shrink-0">
              <h2 id="faq-modal-title" className="text-lg font-bold text-[#29384A]">
                {editingFaqId ? 'Edit FAQ Entry' : 'Add New FAQ Entry'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#5B6C82] hover:text-[#29384A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                aria-label="Close FAQ editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 pb-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="neu-status-error p-3.5 rounded-2xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="faq-category" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Category
                </label>
                <select
                  id="faq-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FaqCategory)}
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                >
                  {Object.values(FaqCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="faq-question" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Question <span className="text-[#B83B3B]">*</span>
                </label>
                <input
                  id="faq-question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Do you offer cash-on-delivery (COD) orders?"
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                />
              </div>

              <div>
                <label htmlFor="faq-answer" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Answer <span className="text-[#B83B3B]">*</span>
                </label>
                <textarea
                  id="faq-answer"
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide accurate policy or product details that the AI agent should share..."
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="neu-btn px-4 py-2.5 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl"
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
