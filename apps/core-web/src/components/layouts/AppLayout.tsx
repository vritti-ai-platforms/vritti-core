import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto pt-16 px-32 py-2.5">
        <Outlet />
      </main>
    </div>
  );
};
