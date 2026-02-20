import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useVersion, useUpdateVersion } from '@/hooks/useModelos';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { BlockPalette } from '@/components/editor/BlockPalette';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { ConfigPanel } from '@/components/editor/ConfigPanel';
import { PageConfigDialog } from '@/components/editor/PageConfigDialog';

// Import all block registrations
import '@/components/blocks/register-all';

export default function EditorPage() {
  const { modeloId: mId, versionId: vId } = useParams<{
    modeloId: string;
    versionId: string;
  }>();
  const modeloId = Number(mId);
  const versionId = Number(vId);

  const { data: versionData, isLoading } = useVersion(modeloId || undefined, versionId || undefined);
  const updateVersion = useUpdateVersion(modeloId);

  const loadSchema = useEditorStore((s) => s.loadSchema);
  const getSchema = useEditorStore((s) => s.getSchema);
  const markClean = useEditorStore((s) => s.markClean);
  const isDirty = useEditorStore((s) => s.isDirty);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const reset = useEditorStore((s) => s.reset);

  const [showPageConfig, setShowPageConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load schema from version data
  useEffect(() => {
    if (versionData) {
      const schema = versionData.schema || { blocks: [], pageConfig: undefined };
      loadSchema(
        {
          blocks: schema.blocks || [],
          pageConfig: schema.pageConfig || undefined,
        },
        modeloId,
        versionId,
      );
    }
  }, [versionData, modeloId, versionId, loadSchema]);

  // Cleanup on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const schema = getSchema();
      await updateVersion.mutateAsync({ id: versionId, schema });
      markClean();
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, getSchema, updateVersion, versionId, markClean]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) handleSave();
        return;
      }
      // ESC: Deselect
      if (e.key === 'Escape') {
        selectBlock(null);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, handleSave, selectBlock]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (isLoading || !versionData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EditorToolbar
        modeloNombre={versionData.modeloComponente?.nombre || 'Template'}
        versionNumero={versionData.version}
        estado={versionData.estado}
        isSaving={isSaving}
        onSave={handleSave}
        onOpenPageConfig={() => setShowPageConfig(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <BlockPalette />
        <EditorCanvas />
        <ConfigPanel />
      </div>

      <PageConfigDialog open={showPageConfig} onOpenChange={setShowPageConfig} />
    </div>
  );
}
