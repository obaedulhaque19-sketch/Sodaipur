import React, { useEffect, useState } from 'react';
import type { Category } from '../../types';
import { Layers, ChevronRight } from 'lucide-react';

interface CategoryCascadeSelectorProps {
  categories: Category[];
  value: {
    mainCategory: string;
    subCategory?: string;
    childCategory?: string;
    microCategory?: string;
    categoryPath: string[];
  };
  onChange: (updated: {
    mainCategory: string;
    subCategory?: string;
    childCategory?: string;
    microCategory?: string;
    categoryPath: string[];
  }) => void;
}

export const CategoryCascadeSelector: React.FC<CategoryCascadeSelectorProps> = ({
  categories,
  value,
  onChange
}) => {
  const mainCategories = categories.filter(c => c.level === 0);

  // Find currently selected category objects
  const selectedMain = categories.find(c => c.name === value.mainCategory && c.level === 0);
  
  const subCategories = selectedMain 
    ? categories.filter(c => c.parentId === selectedMain.categoryId && c.level === 1)
    : [];

  const selectedSub = subCategories.find(c => c.name === value.subCategory);

  const childCategories = selectedSub
    ? categories.filter(c => c.parentId === selectedSub.categoryId && c.level === 2)
    : [];

  const selectedChild = childCategories.find(c => c.name === value.childCategory);

  const microCategories = selectedChild
    ? categories.filter(c => c.parentId === selectedChild.categoryId && c.level === 3)
    : [];

  const handleMainChange = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    onChange({
      mainCategory: catName,
      subCategory: '',
      childCategory: '',
      microCategory: '',
      categoryPath: cat ? [cat.slug] : []
    });
  };

  const handleSubChange = (catName: string) => {
    const subCat = categories.find(c => c.name === catName && c.level === 1);
    const path = [selectedMain?.slug || '', subCat?.slug || ''].filter(Boolean);
    onChange({
      ...value,
      subCategory: catName,
      childCategory: '',
      microCategory: '',
      categoryPath: path
    });
  };

  const handleChildChange = (catName: string) => {
    const childCat = categories.find(c => c.name === catName && c.level === 2);
    const path = [selectedMain?.slug || '', selectedSub?.slug || '', childCat?.slug || ''].filter(Boolean);
    onChange({
      ...value,
      childCategory: catName,
      microCategory: '',
      categoryPath: path
    });
  };

  const handleMicroChange = (catName: string) => {
    const microCat = categories.find(c => c.name === catName && c.level === 3);
    const path = [selectedMain?.slug || '', selectedSub?.slug || '', selectedChild?.slug || '', microCat?.slug || ''].filter(Boolean);
    onChange({
      ...value,
      microCategory: catName,
      categoryPath: path
    });
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <Layers className="w-4 h-4 text-emerald-700" />
        <span>Multi-Tier Taxonomy Selection (Cascading 4-Level)</span>
      </div>

      {/* Active Path Visualizer */}
      <div className="flex items-center flex-wrap gap-1 text-xs py-1.5 px-3 bg-white rounded-lg border border-slate-200 text-slate-600">
        <span className="font-semibold text-slate-400">Path:</span>
        <span className="font-medium text-emerald-800">{value.mainCategory || 'Select Main'}</span>
        {value.subCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-emerald-800">{value.subCategory}</span>
          </>
        )}
        {value.childCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-emerald-800">{value.childCategory}</span>
          </>
        )}
        {value.microCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-emerald-700">{value.microCategory}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Tier 1: Main Category */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            1. Main Category *
          </label>
          <select
            value={value.mainCategory}
            onChange={e => handleMainChange(e.target.value)}
            required
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600"
          >
            <option value="">Select Main Category</option>
            {mainCategories.map(c => (
              <option key={c.categoryId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tier 2: Sub-Category */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            2. Sub-Category
          </label>
          <select
            value={value.subCategory || ''}
            onChange={e => handleSubChange(e.target.value)}
            disabled={subCategories.length === 0}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Select Sub-Category</option>
            {subCategories.map(c => (
              <option key={c.categoryId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tier 3: Child-Category */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            3. Child-Category
          </label>
          <select
            value={value.childCategory || ''}
            onChange={e => handleChildChange(e.target.value)}
            disabled={childCategories.length === 0}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Select Child-Category</option>
            {childCategories.map(c => (
              <option key={c.categoryId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tier 4: Micro-Category */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            4. Micro-Category
          </label>
          <select
            value={value.microCategory || ''}
            onChange={e => handleMicroChange(e.target.value)}
            disabled={microCategories.length === 0}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Select Micro-Category</option>
            {microCategories.map(c => (
              <option key={c.categoryId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
