import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import vrittiLogo from '../assets/vritti-logo.png';

export const MicrofrontendSkeletonFullPage = () => {
  return (
    <div
      className="flex items-center justify-center min-h-screen animate-in fade-in-50 duration-500"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="text-center space-y-6 max-w-md">
        {/* Vritti Logo with pulsing effect */}
        <div className="flex justify-center">
          <div className="relative animate-pulse">
            <img src={vrittiLogo} alt="Vritti AI" className="h-16 w-auto" />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-56 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"
              style={{
                animation: 'loading 2s ease-in-out infinite',
              }}
            />
          </div>
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
};
