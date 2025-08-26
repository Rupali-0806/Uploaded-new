import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useCRM, type Account } from "../contexts/CRMContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Building2,
  Filter,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Edit,
  Trash2,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Save,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function CRMAccounts() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useCRM();
  const [filterType, setFilterType] = useState("all");
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({});

  useEffect(() => {
    const handleTriggerNewItem = (event: CustomEvent) => {
      if (event.detail.type === "accounts") {
        resetForm();
        setShowNewAccountDialog(true);
      }
    };

    window.addEventListener(
      "triggerNewItem",
      handleTriggerNewItem as EventListener,
    );
    return () => {
      window.removeEventListener(
        "triggerNewItem",
        handleTriggerNewItem as EventListener,
      );
    };
  }, []);

  // Accounts data comes from CRM context

  const handleSaveAccount = () => {
    console.log("Saving account:", formData);

    if (!formData.accountName || !formData.industry) {
      alert("Account Name and Industry are required!");
      return;
    }

    try {
      if (editingAccount) {
        // Update existing account
        console.log("Updating existing account:", editingAccount.id);
        updateAccount(editingAccount.id, formData);
        alert("Account updated successfully!");
      } else {
        // Create new account
        const newAccountData = {
          accountName: formData.accountName || "",
          industry: formData.industry || "",
          accountRating: formData.accountRating || "BRONZE",
          revenue: formData.revenue || "$0",
          numberOfEmployees: formData.numberOfEmployees || "1-10",
          city: formData.city || "",
          state: formData.state || "",
          country: formData.country || "",
          website: formData.website || "",
          accountOwner: formData.accountOwner || "Current User",
          status: formData.status || "PROSPECT",
          createdBy: "current-user",
          updatedBy: "current-user"
        };
        console.log("Creating new account:", newAccountData);
        addAccount(newAccountData);
        alert("Account created successfully!");
      }

      setShowNewAccountDialog(false);
      setEditingAccount(null);
      setFormData({});
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Error saving account. Please try again.");
    }
  };

  const handleEditAccount = (account: Account) => {
    console.log("handleEditAccount called with:", account);
    setEditingAccount(account);
    setFormData(account);
    setShowNewAccountDialog(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    console.log("handleDeleteAccount called with ID:", accountId);
    if (window.confirm("Are you sure you want to delete this account?")) {
      deleteAccount(accountId);
      console.log("Account deleted:", accountId);
      alert("Account deleted successfully!");
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingAccount(null);
    setShowNewAccountDialog(false);
  };

  const getTypeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "suspect":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "prospect":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "active_deal":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "do_not_call":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "platinum":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "gold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "silver":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "bronze":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const types = ["Customer", "Prospect", "Partner"];
  const industries = [
    "Technology",
    "Software",
    "Fintech",
    "Manufacturing",
    "Healthcare",
    "Education",
  ];
  const ratings = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];
  const employeeSizes = ["1-10", "10-50", "50-100", "100-500", "500+", "1000+"];

  const filteredAccounts = accounts.filter((account) => {
    const matchesFilter =
      filterType === "all" || (account.status && account.status.toLowerCase() === filterType);

    return matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Accounts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your customer accounts and relationships
            </p>
          </div>
        </div>
        <Dialog
          open={showNewAccountDialog}
          onOpenChange={setShowNewAccountDialog}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                console.log("New Account button clicked!");
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Edit Account" : "Add New Account"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  placeholder="Enter account name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue</Label>
                <Input
                  id="revenue"
                  value={formData.revenue || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, revenue: e.target.value })
                  }
                  placeholder="$2.5M"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfEmployees">Employees</Label>
                <Select
                  value={formData.numberOfEmployees || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, numberOfEmployees: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardNumber">Phone</Label>
                <Input
                  id="boardNumber"
                  value={formData.boardNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, boardNumber: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountOwner">Owner</Label>
                <Input
                  id="accountOwner"
                  value={formData.accountOwner || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, accountOwner: e.target.value })
                  }
                  placeholder="Account owner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountRating">Rating</Label>
                <Select
                  value={formData.accountRating || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountRating: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratings.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveAccount}
                disabled={!formData.accountName || !formData.industry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAccount ? "Update" : "Save"} Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Accounts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {accounts.length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customers
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {accounts.filter((a) => a.status === "PROSPECT").length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Prospects
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {accounts.filter((a) => a.status === "ACTIVE_DEAL").length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Partners
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {accounts.filter((a) => a.status === "SUSPECT").length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Type: {filterType === "all" ? "All" : filterType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("suspect")}>
                  Suspect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("prospect")}>
                  Prospect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("active_deal")}>
                  Active Deal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("do_not_call")}>
                  Do Not Call
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {account.accountName}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Globe className="h-3 w-3 mr-1" />
                        {account.website}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{account.industry}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(account.status || "PROSPECT")}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {account.revenue}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {account.city}, {account.state}
                    </div>
                  </TableCell>
                  <TableCell>{account.accountOwner}</TableCell>
                  <TableCell>
                    <Badge className={getRatingColor(account.accountRating || "BRONZE")}>
                      {account.accountRating}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{account.numberOfEmployees}</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        employees
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(account.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(
                            "Edit button clicked for account:",
                            account,
                          );
                          handleEditAccount(account);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(
                            "Delete button clicked for account:",
                            account.id,
                          );
                          handleDeleteAccount(account.id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
