import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import {
  Contact,
  Account,
  ActivityLog,
  ActiveDeal,
  Lead,
  UserProfile,
  ApiResponse,
  PaginatedResponse,
  CreateContactRequest,
  UpdateContactRequest,
  CreateAccountRequest,
  UpdateAccountRequest,
  CreateActivityRequest,
  UpdateActivityRequest,
  CreateDealRequest,
  UpdateDealRequest,
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  ReportRequest,
} from "@shared/models";

// Helper function to map enum values
const mapEnumValue = (value: any, enumMapping: Record<string, string>) => {
  if (!value) return undefined;
  return (
    Object.keys(enumMapping).find((key) => enumMapping[key] === value) || value
  );
};

// Contacts Routes
export const getContacts: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            {
              emailAddress: { contains: search, mode: "insensitive" as const },
            },
          ],
        }
      : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.count({ where }),
    ]);

    const response: PaginatedResponse<Contact> = {
      success: true,
      data: contacts.map((contact) => ({
        ...contact,
        source: contact.source?.replace(/_/g, " "),
        status: contact.status?.replace(/_/g, " "),
      })) as Contact[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch contacts" });
  }
};

export const getContact: RequestHandler = async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        account: true,
        activities: true,
        deals: true,
      },
    });

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    const response: ApiResponse<Contact> = {
      success: true,
      data: {
        ...contact,
        source: contact.source?.replace(/_/g, " "),
        status: contact.status?.replace(/_/g, " "),
      } as Contact,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ success: false, error: "Failed to fetch contact" });
  }
};

export const createContact: RequestHandler = async (req, res) => {
  try {
    console.log('📨 === CREATE CONTACT REQUEST ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));

    const data: any = req.body;

    // Handle field mapping from frontend
    const nameParts = data.name ? data.name.split(' ') : [];
    const firstName = data.firstName || nameParts[0] || '';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || '';

    console.log('Mapped firstName:', firstName, 'lastName:', lastName);

    const contactData = {
      firstName,
      lastName,
      title: data.title,
      associatedAccount: data.associatedAccount,
      emailAddress: data.emailAddress || data.email,
      deskPhone: data.deskPhone,
      mobilePhone: data.mobilePhone || data.phone,
      city: data.city,
      state: data.state,
      country: data.country,
      timeZone: data.timeZone,
      source: data.source
        ? data.source.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      owner: data.owner,
      status: data.status
        ? data.status.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      createdBy: "system",
      updatedBy: "system",
    };

    console.log('Prepared contactData for Prisma:', JSON.stringify(contactData, null, 2));
    console.log('About to call prisma.contact.create...');

    const contact = await prisma.contact.create({
      data: contactData as any,
    });

    const response: ApiResponse<Contact> = {
      success: true,
      data: {
        ...contact,
        source: contact.source?.replace(/_/g, " "),
        status: contact.status?.replace(/_/g, " "),
      } as Contact,
      message: "Contact created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('🚨 ERROR CREATING CONTACT:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);
    res.status(500).json({ success: false, error: "Failed to create contact", details: error.message });
  }
};

export const updateContact: RequestHandler = async (req, res) => {
  try {
    const data: UpdateContactRequest = req.body;

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...data,
        source: data.source
          ? data.source.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        status: data.status
          ? data.status.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<Contact> = {
      success: true,
      data: {
        ...contact,
        source: contact.source?.replace(/_/g, " "),
        status: contact.status?.replace(/_/g, " "),
      } as Contact,
      message: "Contact updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ success: false, error: "Failed to update contact" });
  }
};

export const deleteContact: RequestHandler = async (req, res) => {
  try {
    await prisma.contact.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, error: "Failed to delete contact" });
  }
};

// Accounts Routes
export const getAccounts: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { accountName: { contains: search, mode: "insensitive" as const } },
            { industry: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.account.count({ where }),
    ]);

    const response: PaginatedResponse<Account> = {
      success: true,
      data: accounts.map((account) => ({
        ...account,
        accountRating: account.accountRating
          ? account.accountRating.replace(/_/g, " ")
          : undefined,
        status: account.status ? account.status.replace("_", " ") : undefined,
        geo: account.geo ? account.geo.replace("_", " ") : undefined,
      })) as Account[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch accounts" });
  }
};

export const getAccount: RequestHandler = async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        activities: true,
        deals: true,
      },
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const response: ApiResponse<Account> = {
      success: true,
      data: {
        ...account,
        accountRating: account.accountRating
          ? account.accountRating.replace(/_/g, " ")
          : undefined,
        status: account.status ? account.status.replace("_", " ") : undefined,
        geo: account.geo ? account.geo.replace("_", " ") : undefined,
      } as Account,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ success: false, error: "Failed to fetch account" });
  }
};

export const createAccount: RequestHandler = async (req, res) => {
  try {
    const data: CreateAccountRequest = req.body;

    const account = await prisma.account.create({
      data: {
        ...data,
        accountRating: data.accountRating
          ? data.accountRating.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        status: data.status
          ? data.status.replace(" ", "_").toUpperCase()
          : undefined,
        geo: data.geo ? data.geo.replace(" ", "_").toUpperCase() : undefined,
        createdBy: "system",
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<Account> = {
      success: true,
      data: {
        ...account,
        accountRating: account.accountRating
          ? account.accountRating.replace(/_/g, " ")
          : undefined,
        status: account.status ? account.status.replace("_", " ") : undefined,
        geo: account.geo ? account.geo.replace("_", " ") : undefined,
      } as Account,
      message: "Account created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ success: false, error: "Failed to create account" });
  }
};

export const updateAccount: RequestHandler = async (req, res) => {
  try {
    const data: UpdateAccountRequest = req.body;

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: {
        ...data,
        accountRating: data.accountRating
          ? data.accountRating.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        status: data.status
          ? data.status.replace(" ", "_").toUpperCase()
          : undefined,
        geo: data.geo ? data.geo.replace(" ", "_").toUpperCase() : undefined,
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<Account> = {
      success: true,
      data: {
        ...account,
        accountRating: account.accountRating
          ? account.accountRating.replace(/_/g, " ")
          : undefined,
        status: account.status ? account.status.replace("_", " ") : undefined,
        geo: account.geo ? account.geo.replace("_", " ") : undefined,
      } as Account,
      message: "Account updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ success: false, error: "Failed to update account" });
  }
};

export const deleteAccount: RequestHandler = async (req, res) => {
  try {
    await prisma.account.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, error: "Failed to delete account" });
  }
};

// Activities Routes
export const getActivities: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { dateTime: "desc" },
        include: {
          contact: true,
          account: true,
        },
      }),
      prisma.activityLog.count(),
    ]);

    const response: PaginatedResponse<ActivityLog> = {
      success: true,
      data: activities.map((activity) => ({
        ...activity,
        activityType: activity.activityType.replace("_", " "),
        outcomeDisposition: activity.outcomeDisposition
          ? activity.outcomeDisposition.replace(/_/g, " ")
          : undefined,
      })) as ActivityLog[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch activities" });
  }
};

export const getActivity: RequestHandler = async (req, res) => {
  try {
    const activity = await prisma.activityLog.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        account: true,
      },
    });

    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    }

    const response: ApiResponse<ActivityLog> = {
      success: true,
      data: {
        ...activity,
        activityType: activity.activityType.replace("_", " "),
        outcomeDisposition: activity.outcomeDisposition
          ? activity.outcomeDisposition.replace(/_/g, " ")
          : undefined,
      } as ActivityLog,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
};

export const createActivity: RequestHandler = async (req, res) => {
  try {
    const data: CreateActivityRequest = req.body;

    const activity = await prisma.activityLog.create({
      data: {
        ...data,
        activityType: data.activityType.replace(" ", "_").toUpperCase(),
        outcomeDisposition: data.outcomeDisposition
          ? data.outcomeDisposition.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        createdBy: "system",
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<ActivityLog> = {
      success: true,
      data: {
        ...activity,
        activityType: activity.activityType.replace("_", " "),
        outcomeDisposition: activity.outcomeDisposition
          ? activity.outcomeDisposition.replace(/_/g, " ")
          : undefined,
      } as ActivityLog,
      message: "Activity created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating activity:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create activity" });
  }
};

export const updateActivity: RequestHandler = async (req, res) => {
  try {
    const data: UpdateActivityRequest = req.body;

    const activity = await prisma.activityLog.update({
      where: { id: req.params.id },
      data: {
        ...data,
        activityType: data.activityType
          ? data.activityType.replace(" ", "_").toUpperCase()
          : undefined,
        outcomeDisposition: data.outcomeDisposition
          ? data.outcomeDisposition.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<ActivityLog> = {
      success: true,
      data: {
        ...activity,
        activityType: activity.activityType.replace("_", " "),
        outcomeDisposition: activity.outcomeDisposition
          ? activity.outcomeDisposition.replace(/_/g, " ")
          : undefined,
      } as ActivityLog,
      message: "Activity updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating activity:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update activity" });
  }
};

export const deleteActivity: RequestHandler = async (req, res) => {
  try {
    await prisma.activityLog.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete activity" });
  }
};

// Deals Routes
export const getDeals: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      prisma.activeDeal.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          account: true,
          contact: true,
        },
      }),
      prisma.activeDeal.count(),
    ]);

    const response: PaginatedResponse<ActiveDeal> = {
      success: true,
      data: deals.map((deal) => ({
        ...deal,
        businessLine: deal.businessLine
          ? deal.businessLine.replace(/_/g, " ")
          : undefined,
        geo: deal.geo ? deal.geo.replace("_", " ") : undefined,
        entity: deal.entity ? deal.entity.replace("_", " ") : undefined,
        stage: deal.stage ? deal.stage.replace(/_/g, " ") : undefined,
      })) as ActiveDeal[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching deals:", error);
    res.status(500).json({ success: false, error: "Failed to fetch deals" });
  }
};

export const getDeal: RequestHandler = async (req, res) => {
  try {
    const deal = await prisma.activeDeal.findUnique({
      where: { id: req.params.id },
      include: {
        account: true,
        contact: true,
      },
    });

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    const response: ApiResponse<ActiveDeal> = {
      success: true,
      data: {
        ...deal,
        businessLine: deal.businessLine
          ? deal.businessLine.replace(/_/g, " ")
          : undefined,
        geo: deal.geo ? deal.geo.replace("_", " ") : undefined,
        entity: deal.entity ? deal.entity.replace("_", " ") : undefined,
        stage: deal.stage ? deal.stage.replace(/_/g, " ") : undefined,
      } as ActiveDeal,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching deal:", error);
    res.status(500).json({ success: false, error: "Failed to fetch deal" });
  }
};

export const createDeal: RequestHandler = async (req, res) => {
  try {
    console.log('📨 === CREATE DEAL REQUEST ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));

    const data: any = req.body;

    // Handle date conversion
    let closingDate: Date | undefined = undefined;
    if (data.closingDate) {
      try {
        if (typeof data.closingDate === 'string') {
          // Handle different date formats
          if (data.closingDate.includes('T')) {
            // Already ISO format
            closingDate = new Date(data.closingDate);
          } else {
            // Convert YYYY-MM-DD to full ISO DateTime
            closingDate = new Date(data.closingDate + 'T12:00:00.000Z');
          }
        } else if (data.closingDate instanceof Date) {
          closingDate = data.closingDate;
        }

        // Validate the date is valid
        if (closingDate && isNaN(closingDate.getTime())) {
          console.warn('Invalid date provided:', data.closingDate);
          closingDate = undefined;
        }
      } catch (error) {
        console.error('Date conversion error:', error, 'Original value:', data.closingDate);
        closingDate = undefined;
      }
    }

    const dealData = {
      dealOwner: data.dealOwner || data.owner,
      dealName: data.dealName,
      businessLine: data.businessLine
        ? data.businessLine.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      associatedAccount: data.associatedAccount,
      associatedContact: data.associatedContact,
      closingDate,
      probability: data.probability ? String(data.probability) : undefined,
      dealValue: data.dealValue ? String(data.dealValue) : undefined,
      approvedBy: data.approvedBy,
      description: data.description,
      nextStep: data.nextStep,
      geo: data.geo ? data.geo.replace(/\s+/g, "_").toUpperCase() : undefined,
      entity: data.entity
        ? data.entity.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      stage: data.stage
        ? data.stage.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      createdBy: "system",
      updatedBy: "system",
    };

    console.log('Prepared dealData for Prisma:', JSON.stringify(dealData, null, 2));
    console.log('About to call prisma.activeDeal.create...');

    const deal = await prisma.activeDeal.create({
      data: dealData as any,
    });

    const response: ApiResponse<ActiveDeal> = {
      success: true,
      data: {
        ...deal,
        businessLine: deal.businessLine
          ? deal.businessLine.replace(/_/g, " ")
          : undefined,
        geo: deal.geo ? deal.geo.replace("_", " ") : undefined,
        entity: deal.entity ? deal.entity.replace("_", " ") : undefined,
        stage: deal.stage ? deal.stage.replace(/_/g, " ") : undefined,
      } as ActiveDeal,
      message: "Deal created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('🚨 ERROR CREATING DEAL:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);
    res.status(500).json({ success: false, error: "Failed to create deal", details: error.message });
  }
};

export const updateDeal: RequestHandler = async (req, res) => {
  try {
    const data: UpdateDealRequest = req.body;

    const deal = await prisma.activeDeal.update({
      where: { id: req.params.id },
      data: {
        ...data,
        businessLine: data.businessLine
          ? data.businessLine.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        geo: data.geo ? data.geo.replace(" ", "_").toUpperCase() : undefined,
        entity: data.entity
          ? data.entity.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        stage: data.stage
          ? data.stage.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<ActiveDeal> = {
      success: true,
      data: {
        ...deal,
        businessLine: deal.businessLine
          ? deal.businessLine.replace(/_/g, " ")
          : undefined,
        geo: deal.geo ? deal.geo.replace("_", " ") : undefined,
        entity: deal.entity ? deal.entity.replace("_", " ") : undefined,
        stage: deal.stage ? deal.stage.replace(/_/g, " ") : undefined,
      } as ActiveDeal,
      message: "Deal updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({ success: false, error: "Failed to update deal" });
  }
};

export const deleteDeal: RequestHandler = async (req, res) => {
  try {
    await prisma.activeDeal.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Error deleting deal:", error);
    res.status(500).json({ success: false, error: "Failed to delete deal" });
  }
};

// Leads Routes
export const getLeads: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count(),
    ]);

    const response: PaginatedResponse<Lead> = {
      success: true,
      data: leads.map((lead) => ({
        ...lead,
        leadSource: lead.leadSource
          ? lead.leadSource.replace(/_/g, " ")
          : undefined,
        status: lead.status ? lead.status.replace("_", " ") : undefined,
        rating: lead.rating ? lead.rating.replace("_", " ") : undefined,
      })) as Lead[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leads" });
  }
};

export const getLead: RequestHandler = async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
    });

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    const response: ApiResponse<Lead> = {
      success: true,
      data: {
        ...lead,
        leadSource: lead.leadSource
          ? lead.leadSource.replace(/_/g, " ")
          : undefined,
        status: lead.status ? lead.status.replace("_", " ") : undefined,
        rating: lead.rating ? lead.rating.replace("_", " ") : undefined,
      } as Lead,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ success: false, error: "Failed to fetch lead" });
  }
};

export const createLead: RequestHandler = async (req, res) => {
  try {
    const data: any = req.body;

    // Handle field mapping from frontend
    const nameParts = data.name ? data.name.split(' ') : [];
    const firstName = data.firstName || nameParts[0] || '';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || '';

    const leadData = {
      firstName,
      lastName,
      company: data.company,
      title: data.title,
      phone: data.phone,
      email: data.email,
      leadSource: data.leadSource || data.source
        ? (data.leadSource || data.source).replace(/\s+/g, "_").toUpperCase()
        : undefined,
      status: data.status
        ? data.status.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      rating: data.rating
        ? data.rating.replace(/\s+/g, "_").toUpperCase()
        : undefined,
      owner: data.owner,
      createdBy: "system",
      updatedBy: "system",
    };

    const lead = await prisma.lead.create({
      data: leadData as any,
    });

    const response: ApiResponse<Lead> = {
      success: true,
      data: {
        ...lead,
        leadSource: lead.leadSource
          ? lead.leadSource.replace(/_/g, " ")
          : undefined,
        status: lead.status ? lead.status.replace("_", " ") : undefined,
        rating: lead.rating ? lead.rating.replace("_", " ") : undefined,
      } as Lead,
      message: "Lead created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ success: false, error: "Failed to create lead" });
  }
};

export const updateLead: RequestHandler = async (req, res) => {
  try {
    const data: UpdateLeadRequest = req.body;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...data,
        leadSource: data.leadSource
          ? data.leadSource.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        status: data.status
          ? data.status.replace(" ", "_").toUpperCase()
          : undefined,
        rating: data.rating
          ? data.rating.replace(" ", "_").toUpperCase()
          : undefined,
        updatedBy: "system",
      } as any,
    });

    const response: ApiResponse<Lead> = {
      success: true,
      data: {
        ...lead,
        leadSource: lead.leadSource
          ? lead.leadSource.replace(/_/g, " ")
          : undefined,
        status: lead.status ? lead.status.replace("_", " ") : undefined,
        rating: lead.rating ? lead.rating.replace("_", " ") : undefined,
      } as Lead,
      message: "Lead updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ success: false, error: "Failed to update lead" });
  }
};

export const deleteLead: RequestHandler = async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ success: false, error: "Failed to delete lead" });
  }
};

// Reports Routes
export const generateReport: RequestHandler = async (req, res) => {
  try {
    const data: ReportRequest = req.body;

    // For now, return a simple report based on current data
    const contacts = await prisma.contact.count();
    const accounts = await prisma.account.count();
    const deals = await prisma.activeDeal.count();
    const activities = await prisma.activityLog.count();
    const leads = await prisma.lead.count();

    const reportData = {
      id: `report_${Date.now()}`,
      reportType: data.reportType,
      period: data.period,
      salesRep: data.salesRep,
      geo: data.geo,
      businessLine: data.businessLine,
      metrics: {
        totalContacts: contacts,
        totalAccounts: accounts,
        totalDeals: deals,
        totalActivities: activities,
        totalLeads: leads,
      },
      generatedAt: new Date(),
      generatedBy: "system",
    };

    res.json({
      success: true,
      data: reportData,
      message: "Report generated successfully",
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate report" });
  }
};

export const downloadReport: RequestHandler = async (req, res) => {
  try {
    // For now, return a simple download response
    res.json({ success: true, message: "Report download feature coming soon" });
  } catch (error) {
    console.error("Error downloading report:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to download report" });
  }
};

// User Profile Routes
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.id;
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const response: ApiResponse<UserProfile> = {
      success: true,
      data: {
        ...userProfile,
        role: userProfile.role?.replace(/_/g, " "),
        notifications: {
          emailNotifications: userProfile.emailNotifications,
          smsNotifications: userProfile.smsNotifications,
          pushNotifications: userProfile.pushNotifications,
        },
      } as UserProfile,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user profile" });
  }
};

export const getCurrentUserProfile: RequestHandler = async (req, res) => {
  try {
    // For now, return the first user profile or create a default one
    let userProfile = await prisma.userProfile.findFirst();

    if (!userProfile) {
      // Create default user profile
      userProfile = await prisma.userProfile.create({
        data: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@yitro.com",
          title: "Sales Manager",
          department: "Sales",
          role: "SALES_MANAGER",
          phone: "+1-555-0100",
          timezone: "EST",
          language: "en",
        },
      });
    }

    const response: ApiResponse<UserProfile> = {
      success: true,
      data: {
        ...userProfile,
        role: userProfile.role?.replace(/_/g, " "),
        notifications: {
          emailNotifications: userProfile.emailNotifications,
          smsNotifications: userProfile.smsNotifications,
          pushNotifications: userProfile.pushNotifications,
        },
      } as UserProfile,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user profile" });
  }
};

export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.id;
    const data: UpdateUserProfileRequest = req.body;

    const userProfile = await prisma.userProfile.update({
      where: { id: userId },
      data: {
        ...data,
        role: data.role
          ? data.role.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        emailNotifications: data.notifications?.emailNotifications,
        smsNotifications: data.notifications?.smsNotifications,
        pushNotifications: data.notifications?.pushNotifications,
      } as any,
    });

    const response: ApiResponse<UserProfile> = {
      success: true,
      data: {
        ...userProfile,
        role: userProfile.role?.replace(/_/g, " "),
        notifications: {
          emailNotifications: userProfile.emailNotifications,
          smsNotifications: userProfile.smsNotifications,
          pushNotifications: userProfile.pushNotifications,
        },
      } as UserProfile,
      message: "Profile updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user profile" });
  }
};

export const updateCurrentUserProfile: RequestHandler = async (req, res) => {
  try {
    const data: UpdateUserProfileRequest = req.body;

    // Update the first (current) user profile
    let userProfile = await prisma.userProfile.findFirst();

    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    userProfile = await prisma.userProfile.update({
      where: { id: userProfile.id },
      data: {
        ...data,
        role: data.role
          ? data.role.replace(/\s+/g, "_").toUpperCase()
          : undefined,
        emailNotifications: data.notifications?.emailNotifications,
        smsNotifications: data.notifications?.smsNotifications,
        pushNotifications: data.notifications?.pushNotifications,
      } as any,
    });

    const response: ApiResponse<UserProfile> = {
      success: true,
      data: {
        ...userProfile,
        role: userProfile.role?.replace(/_/g, " "),
        notifications: {
          emailNotifications: userProfile.emailNotifications,
          smsNotifications: userProfile.smsNotifications,
          pushNotifications: userProfile.pushNotifications,
        },
      } as UserProfile,
      message: "Profile updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user profile" });
  }
};

// No sample data initialization - completely empty
export const initializeSampleData = async () => {
  console.log("✅ CRM sample data initialized");
  return;
};
