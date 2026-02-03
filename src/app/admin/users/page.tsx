
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Copy, Loader2, Search, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/lib/types';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل تحميل البيانات من الخادم.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    return users.filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        (user.name || '').toLowerCase().includes(query) ||
        (user.username || '').toLowerCase().includes(query) ||
        (user.phone || '').includes(query)
      );
    });
  }, [users, searchQuery]);

  const openDialog = (user: User | null = null) => {
    setCurrentUser(user);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setCurrentUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const generatePassword = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "تم النسخ!",
        description: "تم نسخ كلمة السر إلى الحافظة.",
      });
    });
  };

  const generateNextUsername = () => {
    const maxUserNumber = users.reduce((max, user) => {
      // Check for both old prefix (TP) and new prefix (MB) to maintain sequence
      if (user.username.startsWith('TP') || user.username.startsWith('MB')) {
        const num = parseInt(user.username.substring(2));
        if (!isNaN(num) && num > max) {
          return num;
        }
      }
      return max;
    }, 0);
    return `MB${maxUserNumber + 1}`;
  }


  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    try {
      if (currentUser) {
        await updateUser(currentUser.id, userData);
      } else {
        const newUserDataWithDefaults: Omit<User, 'id'> = {
          username: generateNextUsername(),
          password: generatePassword(),
          orderCount: 0,
          debt: 0,
          ...userData
        };
        await addUser(newUserDataWithDefaults);
      }

      toast({ title: currentUser ? "تم تحديث المستخدم بنجاح" : "تم إضافة المستخدم بنجاح" });
      setIsDialogOpen(false);
      setCurrentUser(null);
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (error) {
      toast({ title: "حدث خطأ", description: "فشل حفظ المستخدم.", variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (currentUser) {
      try {
        await deleteUser(currentUser.id);
        toast({ title: "تم حذف المستخدم" });
        setIsDeleteConfirmOpen(false);
        setCurrentUser(null);
        fetchData(); // Re-fetch all data
      } catch (error) {
        toast({ title: "حدث خطأ", description: "فشل حذف المستخدم.", variant: 'destructive' });
      }
    }
  };

  const handleDownloadCSV = () => {
    const csvRows = [];
    const headers = ['id', 'name', 'username', 'phone', 'ordercount', 'debt', 'password', 'address', 'ordercounter'];
    csvRows.push(headers.join(','));

    for (const user of filteredUsers) {
      const values = [
        user.id,
        user.name,
        user.username,
        user.phone,
        user.orderCount,
        user.debt,
        user.password || '',
        user.address || '',
        user.orderCounter || 0,
      ].map(v => {
        const valueStr = String(v ?? '');
        if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
          return `"${valueStr.replace(/"/g, '""')}"`;
        }
        return valueStr;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'users.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1 variants={itemVariant} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">إدارة المستخدمين</motion.h1>
        <motion.div variants={itemVariant} className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 bg-white/50 hover:bg-white/80" onClick={handleDownloadCSV} disabled={isLoading}>
            <Download className="h-4 w-4" />
            تنزيل CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) setCurrentUser(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 shadow-lg hover:shadow-primary/50 transition-shadow" onClick={() => openDialog()}>
                <PlusCircle className="h-4 w-4" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir='rtl'>
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{currentUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                  <DialogDescription>
                    {currentUser ? 'قم بتحديث المعلومات أدناه.' : 'املأ المعلومات لإضافة مستخدم جديد. سيتم إنشاء كلمة سر واسم مستخدم تلقائياً.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">الاسم</Label>
                    <Input id="name" name="name" defaultValue={currentUser?.name} className="col-span-3" />
                  </div>
                  {currentUser && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">اسم المستخدم</Label>
                      <Input id="username" name="username" defaultValue={currentUser?.username} className="col-span-3" readOnly />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
                    <Input id="phone" name="phone" defaultValue={currentUser?.phone} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="address" className="text-right pt-2">العنوان</Label>
                    <Textarea id="address" name="address" defaultValue={currentUser?.address} className="col-span-3" rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">حفظ التغييرات</Button>
                  <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      <motion.div variants={itemVariant}>
        <Card className="glass-card border-none mx-0 sm:mx-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle>قائمة المستخدمين</CardTitle>
              <div className="relative w-full sm:w-72">
                <Input
                  placeholder="ابحث بالاسم، اسم المستخدم، أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white/50 dark:bg-black/20"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead className='text-right font-bold'>الاسم</TableHead>
                    <TableHead className='text-right font-bold'>اسم المستخدم</TableHead>
                    <TableHead className='text-right font-bold'>رقم الهاتف</TableHead>
                    <TableHead className='text-right font-bold'>كلمة السر</TableHead>
                    <TableHead className='text-right font-bold'>عدد الطلبات</TableHead>
                    <TableHead className='text-right font-bold'>الدين المستحق</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <Link href={`/admin/users/${user.id}`} className="hover:underline text-primary">
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">********</span>
                          {user.password && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(user.password!)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.orderCount}</TableCell>
                      <TableCell className={user.debt > 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>{user.debt.toFixed(2)} د.ل</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openDialog(user)}>تعديل</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openDeleteConfirm(user)} className="text-destructive focus:bg-destructive/30 focus:text-destructive-foreground">حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف المستخدم "{currentUser?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
              (ملاحظة: لن يتم حذف طلبات المستخدم السابقة).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default AdminUsersPage;
