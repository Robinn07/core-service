import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjsMjml from 'grapesjs-mjml';

const EmailEditor = ({ templateId, initialData, onSave }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      height: '800px',
      width: 'auto',
      plugins: [grapesjsMjml],
      pluginsOpts: {
        [grapesjsMjml]: {
          /* MJML plugin options */
          resetDevices: false,
        },
      },
      storageManager: false, // We'll handle storage manually
    });

    // Load initial data if available
    if (initialData?.mjmlContent) {
      gjsEditor.setComponents(initialData.mjmlContent);
    }

    setEditor(gjsEditor);

    return () => {
      if (gjsEditor) gjsEditor.destroy();
    };
  }, []);

  const handleSave = () => {
    if (!editor) return;

    // The MJML plugin provides the MJML and the transpiled HTML
    const mjml = editor.getHtml(); // In MJML plugin, getHtml() returns MJML
    const html = editor.runCommand('mjml-get-code').html;
    const designData = editor.getProjectData();

    onSave({
      mjmlContent: mjml,
      htmlContent: html,
      designData: designData,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Visual Email Designer</h2>
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
        >
          Save Template
        </button>
      </div>
      <div ref={editorRef} className="flex-grow" />
    </div>
  );
};

export default EmailEditor;
