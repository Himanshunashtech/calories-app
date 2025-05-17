import { Leaf } from 'lucide-react';
import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Leaf className="h-7 w-7" />
      <span className="text-xl font-semibold">EcoAI</span>
    </div>
  );
}
