import { FileText } from 'lucide-react';

export default function OfertasPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <FileText className="h-16 w-16 text-muted-foreground/40" />
      <h1 className="text-2xl font-semibold text-muted-foreground">Ofertas</h1>
      <p className="text-muted-foreground">Proximamente</p>
    </div>
  );
}
