import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Mail,
  Pencil,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

import { getOrders } from '../lib/ordersApi';
import { getBook } from '../lib/booksApi';
import { Order } from '../lib/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui/card';

import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SegmentedPasswordInput } from '../components/ui/segmentedpasswordinput';

import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../lib/validation';
import { toast } from 'sonner';

type Modal = 'none' | 'editProfile' | 'changePassword';

/* ---------------- Password Input Component ---------------- */
// Now delegates to the shared 8-box segmented password input (see
// segmented-password-input.tsx) so this page's password fields match
// the same UI used on the login/register page. `show`/`onToggle` are
// accepted for backward compatibility with existing call sites but are
// unused — SegmentedPasswordInput manages its own show/hide toggle.
const PwInput = ({
  id,
  label,
  value,
  onChange,
  error
}: any) => (
  <SegmentedPasswordInput
    id={id}
    label={label}
    value={value}
    onChange={onChange}
    error={error}
  />
);

export const Profile = () => {
  const { user, updateUser, changePassword } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [bookTitleMap, setBookTitleMap] = useState<Record<string, string>>({});

  const [activeModal, setActiveModal] = useState<Modal>('none');

  /* ---------------- Edit Profile ---------------- */
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editLoading, setEditLoading] = useState(false);

  /* ---------------- Password ---------------- */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const allOrders = await getOrders();
    const userOrders = (allOrders as unknown as Order[]).filter(o => o.userId === user.id);

    setOrders(userOrders);
    setTotalSpent(userOrders.reduce((s, o) => s + o.total, 0));

    const unique = new Set<string>();
    const map: Record<string, string> = {};

    for (const o of userOrders) {
      for (const i of o.items) {
        unique.add(i.bookId);
        if (!map[i.bookId]) {
          const book = await getBook(i.bookId);
          map[i.bookId] = book?.title || 'Unknown Book';
        }
      }
    }

    setBookTitleMap(map);
    setTotalBooks(unique.size);
  };

  const getBookTitle = (id: string) => bookTitleMap[id] || 'Loading...';

  /* ---------------- MODALS ---------------- */
  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setActiveModal('editProfile');
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveModal('changePassword');
  };

  const closeModal = () => setActiveModal('none');

  /* ---------------- Save Profile ---------------- */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: any = {};
    if (!editName || editName.length < 2) errs.name = 'Min 2 characters';
    if (!validateEmail(editEmail)) errs.email = 'Invalid email';

    if (Object.keys(errs).length) return setEditErrors(errs);

    setEditLoading(true);

    try {
      await updateUser({ name: editName, email: editEmail });
      toast.success('Profile updated');
      closeModal();
    } catch {
      toast.error('Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  /* ---------------- Change Password ---------------- */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: any = {};

    if (!currentPassword) errs.current = 'Required';
    if (!validatePassword(newPassword).valid) errs.new = 'Weak password';
    if (newPassword !== confirmPassword)
      errs.confirm = 'Passwords do not match';

    if (Object.keys(errs).length) return setPwErrors(errs);

    setPwLoading(true);

    try {
      // ✅ FIXED: correct positional arguments
      await changePassword(currentPassword, newPassword);

      toast.success('Password updated');
      closeModal();
    } catch {
      toast.error('Password update failed');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">

        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        {/* PROFILE INFO */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card><CardContent className="p-4"><User /> {user.name}</CardContent></Card>
          <Card><CardContent className="p-4"><Mail /> {user.email}</CardContent></Card>
          <Card><CardContent className="p-4"><Package /> {orders.length} Orders</CardContent></Card>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mb-6">
          <Button onClick={openEditProfile}><Pencil /> Edit</Button>
          <Button onClick={openChangePassword}><Lock /> Password</Button>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card><CardContent>📚 {totalBooks} Books</CardContent></Card>
          <Card><CardContent>📦 {orders.length} Orders</CardContent></Card>
          <Card><CardContent>💰 ${totalSpent}</CardContent></Card>
        </div>

        {/* ORDERS */}
        <Card>
          <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
          <CardContent>
            {orders.map(o => (
              <div key={o.id} className="mb-4">
                <p className="font-bold">Order #{o.id}</p>

                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{getBookTitle(i.bookId)}</span>
                    <span>{i.quantity}x</span>
                  </div>
                ))}

                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* MODALS */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">

            {activeModal === 'editProfile' && (
              <form onSubmit={handleSaveProfile}>
                <h2>Edit Profile</h2>

                <Input value={editName} onChange={e => setEditName(e.target.value)} />
                {editErrors.name && <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>}
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                {editErrors.email && <p className="text-red-500 text-sm mt-1">{editErrors.email}</p>}

                <Button type="submit" disabled={editLoading}>
                  Save
                </Button>
              </form>
            )}

            {activeModal === 'changePassword' && (
              <form onSubmit={handleChangePassword}>
                <h2>Change Password</h2>

                <PwInput
                  id="cur"
                  label="Current"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  onToggle={() => setShowCurrent(!showCurrent)}
                  error={pwErrors.current}
                />

                <PwInput
                  id="new"
                  label="New"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggle={() => setShowNew(!showNew)}
                  error={pwErrors.new}
                />

                <PwInput
                  id="conf"
                  label="Confirm"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  error={pwErrors.confirm}
                />

                <Button type="submit" disabled={pwLoading}>
                  Update
                </Button>
              </form>
            )}

            <button onClick={closeModal} className="mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};