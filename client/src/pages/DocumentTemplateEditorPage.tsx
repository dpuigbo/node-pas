import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocumentTemplate, useUpdateDocumentTemplate } from '@/hooks/useDocumentTemplates';
import { useEditorStore } from '@/stores/useEditorStore';
import { BlockPalette } from '@/components/editor/BlockPalette';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { ConfigPanel } from '@/components/editor/ConfigPanel';
import { PageConfigDialog } from '@/components/editor/PageConfigDialog';

// Import all block registrations
import '@/components/blocks/register-all';

const TIPO_LABELS: Record<string, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
};

export default function DocumentTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const templateId = Number(id);
  const navigate = useNavigate();

  const { data: templateData, isLoading } = useDocumentTemplate(templateId || undefined);
  const updateTemplate = useUpdateDocumentTemplate(templateId);

  const loadSchema = useEditorStore((s) => s.loadSchema);
  const getSchema = useEditorStore((s) => s.getSchema);
  const markClean = useEditorStore((s) => s.markClean);
  const isDirty = useEditorStore((s) => s.isDirty);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const reset = useEditorStore((s) => s.reset);

  const [showPageConfig, setShowPageConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load schema from template data
  useEffect(() => {
    if (templateData) {
      const schema = (templateData.schema as any) || { blocks: [], pageConfig: undefined };
      loadSchema(
        {
          blocks: schema.blocks || [],
          pageConfig: schema.pageConfig || undefined,
        },
        0, // no modeloId for document templates
        templateId,
      );
    }
  }, [templateData, templateId, loadSchema]);

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
      await updateTemplate.mutateAsync({ schema });
      markClean();
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, getSchema, updateTemplate, markClean]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) handleSave();
        return;
      }
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

  if (isLoading || !templateData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/configuracion')}
            title="Volver a configuracion"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{templateData.nombre}</span>
            <Badge className="bg-blue-100 text-blue-800">
              {TIPO_LABELS[templateData.tipo] || templateData.tipo}
            </Badge>
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium">Sin guardar</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPageConfig(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Pagina
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <BlockPalette />
        <EditorCanvas />
        <ConfigPanel />
      </div>

      <PageConfigDialog open={showPageConfig} onOpenChange={setShowPageConfig} />
    </div>
  );
}
