import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="animate-float-slow rounded-full bg-sand p-6 text-teal-700">
        <Compass size={36} />
      </div>
      <p className="mt-6 animate-fade-up font-display text-7xl font-semibold text-teal-700 [animation-delay:100ms]">404</p>
      <p className="mt-3 animate-fade-up text-ink/60 [animation-delay:200ms]">This page wandered off the map. Let's get you back.</p>
      <Link to="/" className="btn-primary mt-6 animate-fade-up px-7 py-3 [animation-delay:300ms]">Go home</Link>
    </div>
  );
}
