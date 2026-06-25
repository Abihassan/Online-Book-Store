import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight
} from 'lucide-react';

import {
  getAdminUsers,
  getReadingStats
} from '../lib/adminApi';

import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  uploadBookFile
} from '../lib/booksApi';

import {
  getOrders,
  updateOrderStatus
} from '../lib/ordersApi';

import { Book, Order, User as UserType } from '../lib/types';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 8;

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

const TablePager = ({ page, total, pageSize, onPage }: any) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between mt-4 items-center">
      <Button disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft />
      </Button>

      <span className="text-sm">
        {page} / {totalPages}
      </span>

      <Button disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
};

export const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [mlData, setMlData] = useState<any>(null);

  const [bookPage, setBookPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: '', author: '', description: '',
    price: '', coverImage: '', genre: '', stock: ''
  });

  // ─────────────────────────────────────────────
  // LOAD DATA (API VERSION)
  // ─────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [bookData, orderData, userData] = await Promise.all([
        getBooks({ page: bookPage }),
        getOrders(),
        getAdminUsers(userPage, '')
      ]);

      setBooks(bookData.books);
      setOrders(orderData as unknown as Order[]);
      setUsers(userData.users as unknown as UserType[]);
    } catch {
      toast.error('Failed to load admin data');
    }
  };

  // ─────────────────────────────────────────────
  // ML DATA (from Code 2 feature)
  // ─────────────────────────────────────────────
  const loadML = async () => {
    try {
      const data = await getReadingStats();
      setMlData(data);
    } catch {
      toast.error('Failed to load ML stats');
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, isAdmin, bookPage, orderPage, userPage]);

  // ─────────────────────────────────────────────
  // BOOK CRUD
  // ─────────────────────────────────────────────
  const handleSaveBook = async () => {
    try {
      const payload = {
        ...bookForm,
        price: parseFloat(bookForm.price) || 0,
        stock: parseInt(bookForm.stock) || 0,
      };
      if (editingBook) {
        await updateBook(editingBook.id, payload as any);
        toast.success('Book updated');
      } else {
        await createBook(payload as any);
        toast.success('Book created');
      }

      setIsDialogOpen(false);
      setEditingBook(null);
      loadData();
    } catch {
      toast.error('Book save failed');
    }
  };

  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    toast.success('Book deleted');
    loadData();
  };

  // ─────────────────────────────────────────────
  // BOOK FILE UPLOAD (PDF / EPUB)
  // ─────────────────────────────────────────────
  const [uploadingBookId, setUploadingBookId] = useState<string | null>(null);

  const handleUploadBookFile = async (bookId: string, file: File) => {
    const allowedExt = ['pdf', 'epub'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExt.includes(ext)) {
      toast.error('Only PDF or EPUB files are allowed');
      return;
    }

    // 25MB sanity limit on the client side — adjust if your books are larger
    const MAX_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error('File is too large (max 25MB)');
      return;
    }

    setUploadingBookId(bookId);
    try {
      await uploadBookFile(bookId, file);
      toast.success('Book file uploaded — readers can now open it in the Library');
      loadData(); // refresh so editingBook/books reflect the new fileUrl
    } catch (err: any) {
      console.error('Book file upload failed:', err);
      toast.error(
        err?.response?.data?.detail || 'Upload failed — please try again'
      );
    } finally {
      setUploadingBookId(null);
    }
  };


  const openFilePicker = (bookId: string) => {
    const input = document.getElementById(
      `book-upload-${bookId}`
    ) as HTMLInputElement | null;

    input?.click();
  };

  // ─────────────────────────────────────────────
  // ORDER UPDATE
  // ─────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await updateOrderStatus(orderId, status);
    toast.success('Order updated');
    loadData();
  };

  // ─────────────────────────────────────────────
  // ANALYTICS (FROM CODE 2)
  // ─────────────────────────────────────────────

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const monthlyRevenue = useMemo(() => {
    const map: any = {};
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
      map[month] = (map[month] || 0) + o.total;
    });
    return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  const userGrowth = useMemo(() => {
    const map: any = {};
    users.forEach(u => {
      const createdDate = (u as any).created_at || (u as any).createdAt;

      if (!createdDate) return;

      const month = new Date(createdDate).toLocaleString('default', { month: 'short' });

      map[month] = (map[month] || 0) + 1;
    });

    return Object.entries(map).map(([month, users]) => ({ month, users }));
  }, [users]);

  const pagedBooks = books.slice((bookPage - 1) * PAGE_SIZE, bookPage * PAGE_SIZE);
  const pagedOrders = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
  const pagedUsers = users.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  if (!user || !isAdmin) return null;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ─────────────────────────────
          SUMMARY CARDS (from Code 2)
      ───────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent>Total Books: {books.length}</CardContent></Card>
        <Card><CardContent>Total Users: {users.length}</CardContent></Card>
        <Card><CardContent>Total Orders: {orders.length}</CardContent></Card>
        <Card><CardContent>Revenue: ${totalRevenue.toFixed(2)}</CardContent></Card>
      </div>

      {/* ─────────────────────────────
          CHARTS (NEW from Code 2)
      ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">

        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#f97316" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* ─────────────────────────────
          TABS (from Code 1 + UI upgrade)
      ───────────────────────────── */}
      <Tabs defaultValue="books">

        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ml" onClick={loadML}>ML Panel</TabsTrigger>
        </TabsList>

        {/* BOOKS */}
        <TabsContent value="books">
          <div className="mb-4 text-sm text-muted-foreground">
            Books Loaded: {books.length}
          </div>

          {pagedBooks.length === 0 ? (
            <div className="border rounded-md p-6 text-center text-muted-foreground">
              No books found.
            </div>
          ) : (
            pagedBooks.map((b) => (
              <div
                key={b.id}
                className="flex justify-between items-center border rounded-md p-3 gap-3 mb-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{b.title}</span>

                  <span className="text-xs text-gray-500">
                    {(b as any).fileUrl || (b as any).file_url
                      ? '📄 File attached'
                      : '⚠ No file uploaded yet'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input
                    id={`book-upload-${b.id}`}
                    type="file"
                    accept=".pdf,.epub"
                    className="hidden"
                    disabled={uploadingBookId === b.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        handleUploadBookFile(b.id, file);
                      }

                      e.target.value = '';
                    }}
                  />

                  {/* Upload Button */}
                  <Button
                    variant="outline"
                    disabled={uploadingBookId === b.id}
                    onClick={() => {
                      const input = document.getElementById(
                        `book-upload-${b.id}`
                      ) as HTMLInputElement | null;

                      input?.click();
                    }}
                  >
                    {uploadingBookId === b.id
                      ? 'Uploading...'
                      : ((b as any).fileUrl || (b as any).file_url)
                      ? 'Replace File'
                      : 'Upload File'}
                  </Button>

                  {/* Edit Dialog */}
                  <Dialog
                    open={isDialogOpen && editingBook?.id === b.id}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);

                      if (open) {
                        setEditingBook(b);

                        setBookForm({
                          title: b.title,
                          author: b.author,
                          description: b.description,
                          price: String(b.price),
                          coverImage: b.coverImage,
                          genre: b.genre,
                          stock: String(b.stock ?? 0),
                        });
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        Edit
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Book</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-2">
                        <Input
                          placeholder="Title"
                          value={bookForm.title}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                        />

                        <Input
                          placeholder="Author"
                          value={bookForm.author}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              author: e.target.value,
                            }))
                          }
                        />

                        <Textarea
                          placeholder="Description"
                          value={bookForm.description}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                        />

                        <Input
                          placeholder="Price"
                          value={bookForm.price}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              price: e.target.value,
                            }))
                          }
                        />

                        <Input
                          placeholder="Genre"
                          value={bookForm.genre}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              genre: e.target.value,
                            }))
                          }
                        />

                        <Input
                          placeholder="Stock"
                          value={bookForm.stock}
                          onChange={(e) =>
                            setBookForm((f) => ({
                              ...f,
                              stock: e.target.value,
                            }))
                          }
                        />

                        <Button
                          className="w-full"
                          onClick={handleSaveBook}
                        >
                          Save
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Delete */}
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBook(b.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}

          <TablePager
            page={bookPage}
            total={books.length}
            pageSize={PAGE_SIZE}
            onPage={setBookPage}
          />
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          {pagedOrders.map(o => (
            <div key={o.id} className="flex justify-between p-2 border">
              <span>{o.id}</span>

              <Select onValueChange={(v) => handleUpdateOrderStatus(o.id, v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          ))}
          <TablePager page={orderPage} total={orders.length} pageSize={PAGE_SIZE} onPage={setOrderPage} />
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          {pagedUsers.map(u => (
            <div key={u.id} className="p-2 border">
              {u.name}
            </div>
          ))}
          <TablePager page={userPage} total={users.length} pageSize={PAGE_SIZE} onPage={setUserPage} />
        </TabsContent>

        {/* ML PANEL */}
        <TabsContent value="ml">
          {mlData && (
            <pre className="text-xs">{JSON.stringify(mlData, null, 2)}</pre>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};