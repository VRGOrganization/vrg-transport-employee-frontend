export function Footer() {
  return (
    <footer className="w-full py-8 px-8 bg-surface-container-low">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="material-symbols-outlined text-3xl text-primary">
              account_balance
            </span>
          </div>
          <div>
            <p className="font-headline font-bold text-primary text-sm">
              São Fidélis Transporte
            </p>
            <p className="font-label text-[10px] text-on-surface-variant">
              Secretaria Municipal de Transportes
            </p>
          </div>
        </div>
        <div className="flex gap-8">
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Ouvidoria
          </a>
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Privacidade
          </a>
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Ajuda
          </a>
        </div>
        <p className="font-label text-[10px] text-outline">
          © 2026 Prefeitura de São Fidélis. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}