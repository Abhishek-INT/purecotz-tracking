import { ChangeEvent } from 'react';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import type { User } from '../types';
import { users } from '../data/masterData';

interface UserSelectorProps {
  currentUser: User | null;
  onUserSelect: (user: User | null) => void;
}

const roleLabels: Record<User['role'], string> = {
  OrderManager: 'Order Manager',
  ProductionManager: 'Production Manager',
  Operations: 'Operations',
};

const UserSelector = ({ currentUser, onUserSelect }: UserSelectorProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;

    if (value === '__logout') {
      onUserSelect(null);
      return;
    }

    const nextUser = users.find((user) => user.id === value);
    if (nextUser) {
      onUserSelect(nextUser);
    }
  };

  return (
    <section className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <UserIcon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-500">Current User</p>
          <h2 className="text-lg font-semibold text-slate-900">
            {currentUser ? currentUser.name : 'No user selected'}
          </h2>
          <p className="text-sm text-slate-500">
            {currentUser ? roleLabels[currentUser.role] : 'Select a user from the list'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="user-selector" className="sr-only">
          Select user
        </label>
        <div className="relative">
          <select
            id="user-selector"
            value={currentUser?.id ?? ''}
            onChange={handleChange}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          >
            <option value="" disabled>
              Choose a user…
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {roleLabels[user.role]}
              </option>
            ))}
            <option value="__logout">Logout</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-slate-400"
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Switching users updates personalization and access controls instantly.
      </p>
    </section>
  );
};

export default UserSelector;

