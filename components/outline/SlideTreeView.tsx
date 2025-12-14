'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SlideElement } from '@/types';

type SlideTreeViewProps = {
  slides: SlideElement[];
  onReorder: (slides: SlideElement[]) => void;
  onDelete: (slideId: string) => void;
  onAddSlide?: (afterSlideId?: string) => void;
  onEditSlideTitle?: (slideId: string, newTitle: string) => void;
  selectedSlideId?: string;
  onSelectSlide?: (slideId: string) => void;
  defaultViewMode?: 'story' | 'list'; // slideStructureProposalがある場合は'list'を推奨
};

// ストーリーフローの定義（提案書の論理構成）
const storyFlow = [
  {
    type: 'executive_summary',
    label: 'サマリー',
    role: '全体像を1枚で伝える',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    type: 'current_recognition',
    label: '現状認識',
    role: 'なぜ今この問題か',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    type: 'issue_setting',
    label: '課題設定',
    role: '何を解決すべきか',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    type: 'tobe_vision',
    label: 'ToBe像',
    role: 'どうなりたいか',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    type: 'approach',
    label: 'アプローチ',
    role: 'どう実現するか',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

// スライドタイプからストーリーフロー情報を取得
const getStoryInfo = (slideType: string | undefined) => {
  if (!slideType) return storyFlow[0];
  if (slideType === 'approach_overview' || slideType === 'approach_detail') {
    return storyFlow.find(s => s.type === 'approach')!;
  }
  return storyFlow.find(s => s.type === slideType) || storyFlow[0];
};

// スライドアイテムコンポーネント
const SlideItem = ({
  slide,
  index,
  isSelected,
  onSelect,
  onDelete,
  onEditTitle,
  canDelete,
  isChild,
  isEditing,
  editingTitle,
  onStartEdit,
  onChangeEditTitle,
  onFinishEdit,
}: {
  slide: SlideElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEditTitle?: (newTitle: string) => void;
  canDelete: boolean;
  isChild?: boolean;
  isEditing?: boolean;
  editingTitle?: string;
  onStartEdit?: () => void;
  onChangeEditTitle?: (title: string) => void;
  onFinishEdit?: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const storyInfo = getStoryInfo(slide.type);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFinishEdit?.();
    } else if (e.key === 'Escape') {
      onFinishEdit?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex gap-2 p-2 rounded border transition-all cursor-pointer ${
        isDragging
          ? 'bg-blue-50 border-blue-300 shadow-lg z-50'
          : isSelected
          ? `${storyInfo.bgColor} ${storyInfo.borderColor} ring-1 ring-yellow-400`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${isChild ? 'ml-4' : ''}`}
    >
      {/* ドラッグハンドル */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 self-start mt-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>

      {/* スライド番号とカラーバー */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-5 h-5 rounded ${storyInfo.color} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{index + 1}</span>
        </div>
        {!isChild && (
          <div className={`w-0.5 flex-1 mt-1 ${storyInfo.color} opacity-30`}></div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 min-w-0">
        {/* スライドタイトル */}
        <div className="flex items-center gap-1.5 mb-1">
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => onChangeEditTitle?.(e.target.value)}
              onBlur={onFinishEdit}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] font-medium px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              autoFocus
            />
          ) : (
            <span
              className={`text-[9px] font-medium ${storyInfo.textColor} uppercase tracking-wider ${onEditTitle ? 'hover:underline cursor-text' : ''}`}
              onDoubleClick={(e) => {
                if (onEditTitle) {
                  e.stopPropagation();
                  onStartEdit?.();
                }
              }}
              title={onEditTitle ? 'ダブルクリックで編集' : undefined}
            >
              {slide.title || storyInfo.label}
            </span>
          )}
        </div>

        {/* メッセージ（2行まで表示） */}
        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
          {slide.mainMessage || slide.content?.body || slide.content?.text || '（メッセージ未設定）'}
        </p>
      </div>

      {/* 編集ボタン（タイトル編集可能な場合） */}
      {onEditTitle && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit?.();
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all shrink-0 self-start"
          title="タイトル編集"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      {/* 削除ボタン */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0 self-start"
          title="削除"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const SlideTreeView: React.FC<SlideTreeViewProps> = ({
  slides,
  onReorder,
  onDelete,
  onAddSlide,
  onEditSlideTitle,
  selectedSlideId,
  onSelectSlide,
  defaultViewMode = 'list', // デフォルトをリストビューに変更
}) => {
  const [viewMode, setViewMode] = useState<'story' | 'list'>(defaultViewMode);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSlides = arrayMove(slides, oldIndex, newIndex);
        const reorderedSlides = newSlides.map((slide, idx) => ({
          ...slide,
          order: idx,
        }));
        onReorder(reorderedSlides);
      }
    }
  };

  const allSlideIds = slides.map((s) => s.id);

  // スライドをセクションごとにグループ化
  const groupedSlides = slides.reduce((acc, slide) => {
    let key = slide.type || 'other';
    if (key === 'approach_detail') key = 'approach';
    if (key === 'approach_overview') key = 'approach';
    if (!acc[key]) acc[key] = [];
    acc[key].push(slide);
    return acc;
  }, {} as Record<string, SlideElement[]>);

  // 現在選択されているスライドのセクション
  const selectedSlide = slides.find(s => s.id === selectedSlideId);
  const selectedSection = selectedSlide ? getStoryInfo(selectedSlide.type) : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-700">
            スライド構成
            <span className="text-gray-400 font-normal ml-1">（{slides.length}枚）</span>
          </h2>
          {/* 表示切り替え & スライド追加 */}
          <div className="flex gap-1 items-center">
            {onAddSlide && (
              <button
                onClick={() => onAddSlide(selectedSlideId || undefined)}
                className="px-2 py-0.5 text-[10px] rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-0.5"
                title="スライドを追加"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                追加
              </button>
            )}
            <button
              onClick={() => setViewMode('story')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                viewMode === 'story'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              ストーリー
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              リスト
            </button>
          </div>
        </div>

        {/* ストーリーフロー（ナビゲーションバー） */}
        <div className="flex items-center gap-0.5 bg-white rounded border border-gray-200 p-1">
          {storyFlow.map((section, idx) => {
            const sectionSlides = groupedSlides[section.type] || [];
            const hasSlides = sectionSlides.length > 0;
            const isActive = selectedSection?.type === section.type;

            return (
              <div key={section.type} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (hasSlides) {
                      onSelectSlide?.(sectionSlides[0].id);
                    }
                  }}
                  disabled={!hasSlides}
                  className={`flex-1 py-1.5 px-1 rounded text-center transition-all ${
                    isActive
                      ? `${section.bgColor} ${section.borderColor} border`
                      : hasSlides
                      ? 'hover:bg-gray-100'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  title={section.role}
                >
                  <div className={`w-3 h-3 rounded-full mx-auto mb-0.5 ${
                    hasSlides ? section.color : 'bg-gray-300'
                  }`}>
                    {hasSlides && (
                      <span className="text-[8px] text-white font-bold leading-[12px]">
                        {sectionSlides.length}
                      </span>
                    )}
                  </div>
                  <p className={`text-[8px] font-medium ${
                    isActive ? section.textColor : 'text-gray-500'
                  }`}>
                    {section.label}
                  </p>
                </button>
                {idx < storyFlow.length - 1 && (
                  <div className="text-gray-300 text-[10px] mx-0.5">→</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 選択中セクションの説明 */}
        {selectedSection && (
          <p className="text-[10px] text-gray-500 mt-1.5 text-center">
            <span className={`font-medium ${selectedSection.textColor}`}>{selectedSection.label}</span>
            <span className="mx-1">:</span>
            <span>{selectedSection.role}</span>
          </p>
        )}
      </div>

      {/* スライドリスト */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allSlideIds} strategy={verticalListSortingStrategy}>
          <div className="p-2 overflow-y-auto flex-1 min-h-0 space-y-1.5">
            {viewMode === 'story' ? (
              // ストーリービュー: セクションごとにグループ化
              storyFlow.map((section) => {
                const sectionSlides = groupedSlides[section.type] || [];
                if (sectionSlides.length === 0) return null;

                return (
                  <div key={section.type} className="mb-3">
                    {/* セクションヘッダー */}
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <div className={`w-2 h-2 rounded-full ${section.color}`}></div>
                      <span className={`text-[10px] font-semibold ${section.textColor} uppercase tracking-wider`}>
                        {section.label}
                      </span>
                      <span className="text-[9px] text-gray-400 flex-1">
                        {section.role}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        {sectionSlides.length}枚
                      </span>
                    </div>

                    {/* スライド一覧 */}
                    <div className="space-y-1">
                      {sectionSlides.map((slide) => {
                        const globalIndex = slides.findIndex(s => s.id === slide.id);
                        const isChild = slide.type === 'approach_detail';
                        return (
                          <SlideItem
                            key={slide.id}
                            slide={slide}
                            index={globalIndex}
                            isSelected={selectedSlideId === slide.id}
                            onSelect={() => onSelectSlide?.(slide.id)}
                            onDelete={() => onDelete(slide.id)}
                            canDelete={
                              slide.type !== 'executive_summary' &&
                              slide.type !== 'current_recognition' &&
                              slide.type !== 'approach_overview'
                            }
                            isChild={isChild}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              // リストビュー: フラットな一覧
              slides.map((slide, index) => (
                <SlideItem
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isSelected={selectedSlideId === slide.id}
                  onSelect={() => onSelectSlide?.(slide.id)}
                  onDelete={() => onDelete(slide.id)}
                  onEditTitle={onEditSlideTitle ? (newTitle) => onEditSlideTitle(slide.id, newTitle) : undefined}
                  canDelete={
                    slide.type !== 'executive_summary' &&
                    slide.type !== 'current_recognition' &&
                    slide.type !== 'approach_overview'
                  }
                  isEditing={editingSlideId === slide.id}
                  editingTitle={editingSlideId === slide.id ? editingTitle : undefined}
                  onStartEdit={() => {
                    setEditingSlideId(slide.id);
                    setEditingTitle(slide.title || '');
                  }}
                  onChangeEditTitle={setEditingTitle}
                  onFinishEdit={() => {
                    if (editingSlideId && onEditSlideTitle && editingTitle.trim()) {
                      onEditSlideTitle(editingSlideId, editingTitle.trim());
                    }
                    setEditingSlideId(null);
                    setEditingTitle('');
                  }}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
