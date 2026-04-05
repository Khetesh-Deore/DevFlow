import { create } from 'zustand';

const useEditorStore = create((set) => ({
  code: '',
  language: 'python',
  submissionResult: null,
  isSubmitting: false,
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setResult: (submissionResult) => set({ submissionResult }),
  setSubmitting: (isSubmitting) => set({ isSubmitting })
}));

export default useEditorStore;
