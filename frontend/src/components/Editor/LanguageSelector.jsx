import useEditorStore from '../../store/editorStore';
import { LANGUAGES } from '../../utils/constants';

export default function LanguageSelector() {
  const { language, setLanguage } = useEditorStore();
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-600"
    >
      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}
