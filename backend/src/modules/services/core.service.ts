import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingStatus,
  BookingType,
  InternationalBookingStatus,
  PaymentMethod,
  PaymentStatus,
  PricingModel,
  Prisma,
  Region,
  ReleaseSource,
  RefundStatus,
  ReportStatus,
  SubscriptionPaymentStatus,
  UserRole,
  DisputeStatus,
  NotificationType,
} from "@prisma/client";
import { effectiveGuideCommissionRate, PLATFORM_CONFIG } from "../../common/config/platform.config";
import { AuditService } from "../../common/services/audit.service";
import { checkMessageSafety, SAFETY_WARNING_PREFIX } from "../../common/utils/message-safety";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import slugify from "slugify";
import { NORTHERN_REGIONS } from "../../common/constants/regions.constants";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "./notification.service";
import { UpdateAgencyProfileDto } from "../dto/agencies.dto";
import {
  CreateDestinationDto,
  UpdateDestinationDto,
} from "../dto/destinations.dto";
import { UpdateGuideProfileDto } from "../dto/guides.dto";
import { CreatePackageDto, UpdatePackageDto } from "../dto/packages.dto";
import { InitiatePaymentDto } from "../dto/payment-initiation.dto";
import { AgencySubscriptionPaymentDto } from "../dto/subscription-payment.dto";
import { CreateReportDto } from "../dto/reports.dto";
import { CreateReviewDto } from "../dto/reviews.dto";
import { UpdateMeDto } from "../dto/users.dto";
import { DisputeDto } from "../dto/bookings.dto";
import { PaymentProviderFactory } from "../payments/providers/payment-provider.factory";


@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly audit: AuditService,
    private readonly paymentProviders: PaymentProviderFactory,
  ) {}

  private uid(): string {
    return randomUUID();
  }
  private ts(): Date {
    return new Date();
  }
  private slug(value: string): string {
    return slugify(value, { lower: true, strict: true, trim: true });
  }

  private ensureNorthern(region: Region): void {
    if (!NORTHERN_REGIONS.includes(region)) {
      throw new BadRequestException("Allowed only for northern regions");
    }
  }

  userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    phone: true,
    avatar: true,
    isActive: true,
    isEmailVerified: true,
  } satisfies Prisma.usersSelect;

  me(userId: string) {
    return this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: this.userSelect,
    });
  }
  updateMe(userId: string, body: UpdateMeDto) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { ...body, updatedAt: this.ts() },
      select: this.userSelect,
    });
  }
  deleteMe(userId: string) {
    return this.prisma.users.delete({ where: { id: userId } });
  }

  async changePassword(userId: string, body: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    const isValid = await bcrypt.compare(body.currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashed, updatedAt: this.ts() },
    });
    return { message: 'Password changed successfully' };
  }

  guides() {
    return this.prisma.guides.findMany({
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }
  guideBySlug(slug: string) {
  return this.prisma.guides.findUnique({
    where: { slug },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  }).then(guide => {
    if (!guide) {
      throw new NotFoundException(`Guide with slug "${slug}" not found`);
    }
    return guide;
  });
} 
  myGuideProfile(userId: string) {
    return this.prisma.guides.findUniqueOrThrow({
      where: { userId },
      include: { users: true },
    });
  }
  updateMyGuideProfile(userId: string, body: UpdateGuideProfileDto) {
    if (body.region) this.ensureNorthern(body.region);
    return this.prisma.guides.update({
      where: { userId },
      data: { ...body, updatedAt: this.ts() },
    });
  }// ============================================================
// Relevant agency methods in CoreService
// Replace/merge these methods into your existing CoreService
// ============================================================



// ------------------------------------------------------------------
// List agencies with optional filtering + pagination (public)
// ------------------------------------------------------------------
async agencies(params?: {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  minRating?: number;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: string;
}) {
  const {
    page = 1,
    limit = 20,
    city,
    country,
    minRating,
    isVerified,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params ?? {};

  const where: any = {};
  if (city)                     where.city       = { contains: city,    mode: 'insensitive' };
  if (country)                  where.country    = { contains: country, mode: 'insensitive' };
  if (minRating !== undefined)  where.rating     = { gte: minRating };
  if (isVerified !== undefined) where.isVerified = isVerified;

  const validSortFields = ['createdAt', 'rating', 'name', 'totalReviews'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir   = sortOrder === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    this.prisma.agencies.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        // Include package count for the listing cards
        _count: {
          select: { packages: true },
        },
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.agencies.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ------------------------------------------------------------------
// Get a single agency by slug (public)
// Includes packages, reviews, gallery, and safe user fields
// ------------------------------------------------------------------
async agencyBySlug(slug: string) {
  const agency = await this.prisma.agencies.findUnique({
    where: { slug },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
      },
      packages: {
        include: {
          destinations: true,
        },
      },
      reviews: {
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!agency) {
    throw new NotFoundException(`Agency with slug "${slug}" not found`);
  }
  return agency;
}

// ------------------------------------------------------------------
// Get the authenticated agency's own profile
// Uses select on users — never exposes the hashed password.
// Returns null for new agencies so the frontend shows the setup screen.
// ------------------------------------------------------------------
myAgencyProfile(userId: string) {
  return this.prisma.agencies.findUnique({
    where: { userId },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
        },
      },
      packages: true,
    },
  });
}

// ------------------------------------------------------------------
// Update the authenticated agency's profile
// Only updates fields that are explicitly provided (no accidental nulls)
// Regenerates the slug when name changes, with uniqueness collision guard
// ------------------------------------------------------------------
async updateMyAgencyProfile(userId: string, body: UpdateAgencyProfileDto) {
  let newSlug: string | undefined;

  if (body.name !== undefined) {
    const baseSlug = this.slug(body.name);
    const collision = await this.prisma.agencies.findFirst({
      where: { slug: baseSlug, NOT: { userId } },
      select: { id: true },
    });
    newSlug = collision ? `${baseSlug}-${Date.now()}` : baseSlug;
  }

  return this.prisma.agencies.update({
    where: { userId },
    data: {
      ...(body.name          !== undefined && { name:          body.name }),
      ...(newSlug            !== undefined && { slug:          newSlug }),
      ...(body.description   !== undefined && { description:   body.description }),
      ...(body.city          !== undefined && { city:          body.city }),
      ...(body.country       !== undefined && { country:       body.country }),
      ...(body.website       !== undefined && { website:       body.website }),
      ...(body.address       !== undefined && { address:       body.address }),
      ...(body.logo          !== undefined && { logo:          body.logo }),
      ...(body.coverImage    !== undefined && { coverImage:    body.coverImage }),
      ...(body.galleryImages !== undefined && { galleryImages: body.galleryImages }),
      ...(body.region        !== undefined && { region:        body.region }),
      updatedAt: this.ts(),
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });
}
  destinations() {
    return this.prisma.destinations.findMany({ where: { isActive: true } });
  }
  destinationBySlug(slug: string) {
    return this.prisma.destinations.findUniqueOrThrow({ where: { slug } });
  }

  createDestination(body: CreateDestinationDto) {
    this.ensureNorthern(body.region);
    const { title, country, ...rest } = body;
    return this.prisma.destinations.create({
      data: {
        id: this.uid(),
        updatedAt: this.ts(),
        name: title,
        country: country ?? "Pakistan",
        slug: this.slug(title),
        ...rest,
      },
    });
  }
  updateDestination(id: string, body: UpdateDestinationDto) {
    if (body.region) this.ensureNorthern(body.region);
    const { title, ...rest } = body;
    return this.prisma.destinations.update({
      where: { id },
      data: {
        ...rest,
        ...(title !== undefined ? { name: title } : {}),
        updatedAt: this.ts(),
      },
    });
  }
  async deleteDestination(id: string, hardDelete = false) {
    if (hardDelete) {
      const count = await this.prisma.packages.count({
        where: { destinationId: id },
      });
      if (count > 0)
        throw new BadRequestException("Cannot delete: packages are linked");
      return this.prisma.destinations.delete({ where: { id } });
    }
    return this.prisma.destinations.update({
      where: { id },
      data: { isActive: false, updatedAt: this.ts() },
    });
  }

  packages() {
    return this.prisma.packages.findMany({
      where: { isActive: true },
      include: {
        destinations: true,
        guides: { include: { users: true } },
        agencies: true,
      },
    });
  }
  packageBySlug(slug: string) {
    return this.prisma.packages.findUniqueOrThrow({
      where: { slug },
      include: {
        destinations: true,
        guides: { include: { users: true } },
        agencies: true,
      },
    });
  }
  myPackages(userId: string, role: UserRole) {
    return role === UserRole.GUIDE
      ? this.prisma.packages.findMany({ where: { guides: { userId } } })
      : this.prisma.packages.findMany({ where: { agencies: { userId } } });
  }

  createPackage(userId: string, role: UserRole, body: CreatePackageDto) {
    return (async () => {
      const guide =
        role === UserRole.GUIDE
          ? await this.prisma.guides.findUnique({ where: { userId } })
          : null;
      const agency =
        role === UserRole.AGENCY
          ? await this.prisma.agencies.findUnique({ where: { userId } })
          : null;
      return this.prisma.packages.create({
        data: {
          id: this.uid(),
          updatedAt: this.ts(),
          destinationId: body.destinationId,
          title: body.title,
          description: body.description,
          price: body.price,
          duration: body.durationDays,
          maxGroupSize: body.maxGroupSize,
          images: body.images ?? [],
          includes: body.includes ?? [],
          excludes: body.excludes ?? [],
          itinerary: body.itinerary,
          slug: this.slug(body.title),
          guideId: guide?.id,
          agencyId: agency?.id,
        },
      });
    })();
  }
  updatePackage(id: string, body: UpdatePackageDto) {
    const { durationDays, ...rest } = body;
    return this.prisma.packages.update({
      where: { id },
      data: {
        ...rest,
        ...(durationDays !== undefined ? { duration: durationDays } : {}),
        updatedAt: this.ts(),
      },
    });
  }
  async deletePackage(id: string, hardDelete = false) {
    if (hardDelete) {
      const bookingsCount = await this.prisma.bookings.count({ where: { packageId: id } });
      if (bookingsCount > 0) throw new BadRequestException('Cannot delete: bookings exist for this package');
      return this.prisma.packages.delete({ where: { id } });
    }
    return this.prisma.packages.update({ where: { id }, data: { isActive: false, updatedAt: this.ts() } });
  }

  async calculatePrice(body: {
    packageId?: string;
    guideId?: string;
    startDate: string;
    endDate: string;
    groupSize: number;
  }) {
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(body.endDate).getTime() -
          new Date(body.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    
    if (body.guideId) {
      const guide = await this.prisma.guides.findUniqueOrThrow({
        where: { id: body.guideId },
      });
      const basePrice = (guide.pricePerDay || 0) * days;
      const commission = Math.round(basePrice * 0.15);
      return {
        type: "GUIDE",
        pricingModel: "PER_DAY",
        basePrice,
        pricePerDay: guide.pricePerDay || 0,
        days,
        travelers: body.groupSize,
        commission,
        commissionRate: 15,
        total: basePrice,
        currency: "PKR",
      };
    }
    
    if (body.packageId) {
      const pkg = await this.prisma.packages.findUniqueOrThrow({
        where: { id: body.packageId },
      });
      const basePrice = Number(pkg.price) * body.groupSize;
      return {
        type: pkg.guideId ? "GUIDE_PACKAGE" : "AGENCY_PACKAGE",
        pricingModel: pkg.pricingModel || "PER_PERSON",
        basePrice,
        pricePerPerson: Number(pkg.price),
        travelers: body.groupSize,
        commission: 0,
        commissionRate: 0,
        total: basePrice,
        currency: "PKR",
      };
    }
    throw new BadRequestException("Either packageId or guideId is required");
  }

  // ============================================
  // CREATE BOOKING (IDEMPOTENT - Returns existing if duplicate)
  // ============================================

  async createBooking(
    userId: string,
    body: {
      packageId?: string;
      guideId?: string;
      startDate: string;
      endDate: string;
      groupSize?: number;
      notes?: string;
      isInternational?: boolean;
    },
  ) {
    // Validate dates
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Invalid date format. Please use YYYY-MM-DD");
    }
    
    if (end <= start) {
      throw new BadRequestException("End date must be after start date");
    }
    
    let packageId = body.packageId;
    let totalPrice = 0;
    let guideId: string | undefined;
    
    // Handle direct guide booking (without package)
    if (!packageId && body.guideId) {
      guideId = body.guideId;
      const guide = await this.prisma.guides.findUniqueOrThrow({
        where: { id: body.guideId },
        include: { users: true },
      });
      
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const basePrice = (guide.pricePerDay || 0) * days;
      totalPrice = basePrice;
      
      // Create a temporary package for this guide booking
      let defaultDest = await this.prisma.destinations.findFirst({
        where: { slug: "direct-guide-booking" },
      });
      if (!defaultDest) {
        defaultDest = await this.prisma.destinations.create({
          data: {
            id: this.uid(),
            updatedAt: this.ts(),
            name: "Direct Guide Booking",
            slug: "direct-guide-booking",
            city: "Northern Areas",
            country: "Pakistan",
            isActive: true,
          },
        });
      }
      
      const autoPackage = await this.prisma.packages.create({
        data: {
          id: this.uid(),
          updatedAt: this.ts(),
          slug: `guide-booking-${this.uid().slice(0, 8)}`,
          title: `Guide: ${guide.users?.firstName || "Guide"} ${guide.users?.lastName || ""}`,
          description: "Direct guide booking",
          price: guide.pricePerDay || 0,
          duration: days,
          maxGroupSize: 20,
          images: [],
          includes: ["Guide Service"],
          excludes: [],
          guideId: body.guideId,
          destinationId: defaultDest.id,
          pricingModel: "PER_DAY",
        },
      });
      packageId = autoPackage.id;
    }
    
    if (!packageId) {
      throw new BadRequestException("Either packageId or guideId is required");
    }
    
    const pkg = await this.prisma.packages.findUniqueOrThrow({
      where: { id: packageId },
      include: { guides: true, agencies: true },
    });
    
    if (!pkg.isActive) {
      throw new BadRequestException("Package is not available");
    }
    
    if (!body.guideId && (body.groupSize ?? 1) > pkg.maxGroupSize) {
      throw new BadRequestException(`Group size exceeds maximum of ${pkg.maxGroupSize}`);
    }
    
    if (!totalPrice) {
      totalPrice = Number(pkg.price) * (body.groupSize ?? 1);
    }
    if (!guideId && pkg.guideId) {
      guideId = pkg.guideId;
    }
    
    // Check for duplicate booking - RETURN EXISTING INSTEAD OF ERROR
    const duplicate = await this.prisma.bookings.findFirst({
      where: {
        userId,
        packageId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startDate: start,
      },
    });
    
    if (duplicate) {
      this.logger.log(`Duplicate booking detected, returning existing booking: ${duplicate.id}`);
      return duplicate;
    }
    
    // Determine booking type and pricing model
    const isGuideBooking = !!body.guideId;
    const commissionRate = isGuideBooking ? effectiveGuideCommissionRate() : 0;
    const commissionAmount = Math.round(totalPrice * commissionRate / 100);

    // Agency bookings are CONFIRMED immediately (direct payment, no escrow needed).
    // Guide bookings start as PENDING until payment is initiated.
    const isAgencyBooking = !!pkg.agencyId && !isGuideBooking;
    const initialStatus = isAgencyBooking ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

    // Create booking
    const booking = await this.prisma.bookings.create({
      data: {
        id: this.uid(),
        updatedAt: this.ts(),
        userId,
        packageId,
        startDate: start,
        endDate: end,
        groupSize: body.groupSize ?? 1,
        notes: body.notes,
        totalPrice,
        status: initialStatus,
        isInternational: body.isInternational || false,
        pricingModel: isGuideBooking ? PricingModel.PER_DAY : PricingModel.PER_PERSON,
        bookingType: isGuideBooking ? BookingType.GUIDE : BookingType.PACKAGE,
        commissionAmount,
        ...(body.isInternational && { internationalBookingStatus: InternationalBookingStatus.PENDING_REVIEW }),
      },
    });

    this.audit.log({
      action: 'booking.created',
      actorId: userId,
      resourceType: 'booking',
      resourceId: booking.id,
      metadata: {
        packageId,
        totalPrice,
        status: initialStatus,
        isInternational: body.isInternational || false,
        bookingType: isGuideBooking ? 'GUIDE' : 'PACKAGE',
      },
    });

    return booking;
  }

  // ============================================
  // INITIATE PAYMENT
  // Hardened: amount integrity, duplicate guard, provider call,
  // heldUntil population, booking.paymentMethod write.
  // ============================================

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: dto.bookingId },
      include: { payments: true, packages: true },
    });

    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new ForbiddenException("Not your booking");

    // Step 1: Reject terminal booking states
    const nonPayableStatuses: BookingStatus[] = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
      BookingStatus.DISPUTED,
    ];
    if (nonPayableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot initiate payment on a ${booking.status} booking`);
    }

    // Step 2: Duplicate payment guard (ADD-5)
    // Return existing active payment reference instead of double-charging.
    if (booking.payments) {
      const activeStatuses: PaymentStatus[] = [
        PaymentStatus.HELD,
        PaymentStatus.CONFIRMED,
        PaymentStatus.PENDING_REVIEW,
        PaymentStatus.PENDING,
      ];
      if (activeStatuses.includes(booking.payments.status)) {
        return {
          ...booking.payments,
          _message: 'A payment is already in progress for this booking.',
        };
      }
    }

    // Step 3: Amount integrity check (ADD-3)
    // Server-side verification — never trust the frontend-submitted amount.
    const expectedAmount = booking.totalPrice;
    const tolerance = 1; // Rs 1 floating-point tolerance
    if (Math.abs(dto.amount - expectedAmount) > tolerance) {
      this.audit.log({
        action: 'payment.amount_mismatch',
        actorId: userId,
        resourceType: 'booking',
        resourceId: dto.bookingId,
        metadata: {
          submitted: dto.amount,
          expected: expectedAmount,
          bookingId: dto.bookingId,
        },
      });
      throw new BadRequestException(
        `Payment amount does not match booking cost. ` +
        `Expected: Rs ${expectedAmount}. Submitted: Rs ${dto.amount}.`,
      );
    }

    // Step 4: Generate VoyageX local reference
    const localRef = `VX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${this.uid().slice(0, 8).toUpperCase()}`;

    // Step 5: Call the payment provider (sandbox: generates fake gateway reference)
    const provider = this.paymentProviders.getProvider(dto.paymentMethod);
    const providerResult = await provider.initiatePayment({
      bookingId: dto.bookingId,
      userId,
      amount: expectedAmount,
      currency: PLATFORM_CONFIG.currency,
      reference: localRef,
      mobileNumber: dto.mobileNumber,
      cardToken: dto.cardToken,
      bankReference: dto.bankReference,
      proofUrl: dto.proofUrl,
    });

    // Step 6: Determine initial payment status
    // Bank Transfer: PENDING_REVIEW (admin must verify proof)
    // All others:    HELD (gateway sandbox accepted immediately)
    const initialStatus =
      dto.paymentMethod === PaymentMethod.BANK_TRANSFER
        ? PaymentStatus.PENDING_REVIEW
        : PaymentStatus.HELD;

    // Step 7: Calculate escrow hold deadline (H-5)
    // Trip end date + grace period. Fallback to creation + default hold.
    const now = this.ts();
    const tripEnd = booking.endDate ? new Date(booking.endDate) : null;
    const heldUntil = tripEnd
      ? new Date(tripEnd.getTime() + PLATFORM_CONFIG.escrowGracePeriodDays * 86_400_000)
      : new Date(now.getTime() + PLATFORM_CONFIG.escrowDefaultHoldDays * 86_400_000);

    // Step 8: Persist payment record with all required fields
    const payment = await this.prisma.payments.create({
      data: {
        id: this.uid(),
        updatedAt: now,
        bookingId: dto.bookingId,
        userId,
        method: dto.paymentMethod,
        amount: expectedAmount,
        currency: PLATFORM_CONFIG.currency,
        status: initialStatus,
        transactionId: localRef,
        providerTransactionId: providerResult.providerTransactionId,
        proofUrl: dto.proofUrl ?? null,
        cardToken: dto.cardToken ?? null,
        heldUntil,
      },
    });

    // Step 9: Write payment method to booking (H-6)
    const bookingUpdateData: Record<string, unknown> = {
      paymentMethod: dto.paymentMethod,
      updatedAt: now,
    };
    if (booking.status === BookingStatus.PENDING) {
      // PENDING_REVIEW for bank transfer — only fully confirm once admin approves
      bookingUpdateData.status =
        dto.paymentMethod === PaymentMethod.BANK_TRANSFER
          ? BookingStatus.PENDING
          : BookingStatus.CONFIRMED;
    }
    await this.prisma.bookings.update({
      where: { id: dto.bookingId },
      data: bookingUpdateData,
    });

    // Step 10: Audit log
    this.audit.log({
      action: 'payment.initiated',
      actorId: userId,
      resourceType: 'payment',
      resourceId: payment.id,
      metadata: {
        bookingId: payment.bookingId,
        method: payment.method,
        amount: payment.amount,
        providerTransactionId: providerResult.providerTransactionId,
        status: initialStatus,
        heldUntil,
        sandboxMode: PLATFORM_CONFIG.sandboxMode,
      },
    });

    return {
      ...payment,
      providerMessage: providerResult.message,
      redirectUrl: providerResult.redirectUrl,
    };
  }

  // ============================================
  // PAYMENT PROOF REVIEW (Bank Transfer admin workflow)
  // ============================================

  async approvePaymentProof(paymentId: string, adminId: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        bookings: {
          include: { packages: true, users: true },
        },
        users: true,
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Payment is not pending review (current status: ${payment.status})`,
      );
    }

    const now = this.ts();
    await this.prisma.payments.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.HELD, updatedAt: now },
    });

    await this.prisma.bookings.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED, updatedAt: now },
    });

    // Notify traveler
    await this.notificationService.createNotification(
      payment.userId,
      NotificationType.PAYMENT_PROOF_APPROVED,
      'Payment Verified',
      `Your bank transfer payment has been verified. Your booking is now confirmed.`,
      { bookingId: payment.bookingId, paymentId },
    );

    this.audit.log({
      action: 'payment.proof_approved',
      actorId: adminId,
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { bookingId: payment.bookingId, amount: payment.amount },
    });

    return { message: 'Payment approved', paymentId, bookingId: payment.bookingId };
  }

  async rejectPaymentProof(paymentId: string, adminId: string, reason: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { users: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Payment is not pending review (current status: ${payment.status})`,
      );
    }

    const now = this.ts();
    await this.prisma.payments.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, updatedAt: now },
    });

    await this.notificationService.createNotification(
      payment.userId,
      NotificationType.PAYMENT_PROOF_REJECTED,
      'Payment Rejected',
      `Your bank transfer payment proof was rejected. Reason: ${reason}. Please resubmit with correct proof.`,
      { bookingId: payment.bookingId, paymentId, reason },
    );

    this.audit.log({
      action: 'payment.proof_rejected',
      actorId: adminId,
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { bookingId: payment.bookingId, reason },
    });

    return { message: 'Payment rejected', paymentId, reason };
  }

  // ============================================
  // REFUND
  // ============================================

  async createRefund(
    paymentId: string,
    adminId: string,
    amount: number,
    reason: string,
  ) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { bookings: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const provider = this.paymentProviders.getProvider(payment.method);
    const refundRef = `sandbox_refund_${this.uid()}`;

    // In production: call provider.initiateRefund(payment.providerTransactionId, amount)
    // Requires providerTransactionId to be populated (H-2).
    // Each gateway has a different refund API endpoint.
    let providerRefundId = refundRef;
    if (!PLATFORM_CONFIG.sandboxMode && payment.providerTransactionId) {
      const result = await provider.initiateRefund({
        providerTransactionId: payment.providerTransactionId,
        amount,
        reason,
      });
      providerRefundId = result.refundReference;
    }

    const now = this.ts();
    const refund = await this.prisma.refunds.create({
      data: {
        id: this.uid(),
        bookingId: payment.bookingId,
        paymentId,
        amount,
        currency: payment.currency,
        reason,
        status: RefundStatus.PENDING,
        initiatedById: adminId,
        providerRefundId,
        updatedAt: now,
      },
    });

    this.audit.log({
      action: 'payment.refunded',
      actorId: adminId,
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { amount, reason, refundId: refund.id, providerRefundId },
    });

    return refund;
  }

  async cancelBooking(id: string, userId: string, role: UserRole) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: true } } },
    });

    const isOwner = booking.userId === userId;
    const isGuide = booking.packages.guides?.userId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isOwner && !isGuide && !isAdmin) {
      throw new ForbiddenException("Not authorized to cancel");
    }

    // Cannot cancel after tour has started or beyond
    const cancellableStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel a booking in ${booking.status} status. ` +
        `Only PENDING or CONFIRMED bookings can be cancelled.`,
      );
    }

    const updated = await this.prisma.bookings.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, updatedAt: this.ts() },
    });

    this.audit.log({
      action: 'booking.cancelled',
      actorId: userId,
      actorRole: role,
      resourceType: 'booking',
      resourceId: id,
      metadata: { previousStatus: booking.status },
    });

    return updated;
  }

  async startTour(id: string, guideId: string) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: true } }, users: true },
    });
    
    if (booking.packages.guides?.userId !== guideId) {
      throw new ForbiddenException("Not your booking");
    }
    
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException("Tour can only be started from CONFIRMED status");
    }
    
    const updated = await this.prisma.bookings.update({
      where: { id },
      data: { status: BookingStatus.IN_PROGRESS, updatedAt: this.ts() },
    });
    
    await this.notificationService.notifyTourStarted(
      id,
      booking.userId,
      booking.users?.firstName || "Guide"
    );
    
    return updated;
  }

  async requestCompletion(id: string, guideId: string) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: true } }, users: true },
    });
    
    if (booking.packages.guides?.userId !== guideId) {
      throw new ForbiddenException("Not your booking");
    }
    
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException("Tour must be IN_PROGRESS to request completion");
    }
    
    const autoReleaseAt = new Date();
    autoReleaseAt.setDate(autoReleaseAt.getDate() + 7);
    
    const updated = await this.prisma.bookings.update({
      where: { id },
      data: {
        status: BookingStatus.AWAITING_TRAVELER_CONFIRMATION,
        guideConfirmedAt: this.ts(),
        autoReleaseAt,
        updatedAt: this.ts(),
      },
    });
    
    const traveler = await this.prisma.users.findUnique({
      where: { id: booking.userId },
      select: { firstName: true, lastName: true }
    });
    
    await this.notificationService.notifyCompletionRequested(
      id,
      booking.userId,
      `${traveler?.firstName || "Traveler"} ${traveler?.lastName || ""}`,
      autoReleaseAt,
      booking.totalPrice
    );
    
    return updated;
  }

  async confirmCompletion(
    id: string,
    travelerId: string,
    releaseSource: ReleaseSource = ReleaseSource.TRAVELER_CONFIRMATION,
  ) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: { include: { users: true } } } }, payments: true },
    });

    // Ownership check is skipped for system-triggered auto-releases
    if (releaseSource === ReleaseSource.TRAVELER_CONFIRMATION && booking.userId !== travelerId) {
      throw new ForbiddenException("Not your booking");
    }

    if (booking.status !== BookingStatus.AWAITING_TRAVELER_CONFIRMATION) {
      throw new BadRequestException("Booking is not awaiting confirmation");
    }

    // Guard: do not release a payment that is already released or refunded
    if (booking.payments && booking.payments.status !== PaymentStatus.HELD) {
      throw new BadRequestException(
        `Payment is already in ${booking.payments.status} state and cannot be released again`,
      );
    }

    const commissionRate = effectiveGuideCommissionRate();
    const commission = Math.round(booking.totalPrice * commissionRate / 100);
    const guidePayout = booking.totalPrice - commission;
    const now = this.ts();

    if (booking.payments) {
      await this.prisma.payments.update({
        where: { bookingId: id },
        data: {
          status: PaymentStatus.RELEASED,
          releasedAt: now,
          releasedBy: releaseSource === ReleaseSource.AUTO_RELEASE ? 'SYSTEM' : travelerId,
          releaseSource,
          payoutAmount: guidePayout,
          updatedAt: now,
        },
      });
    }

    const updated = await this.prisma.bookings.update({
      where: { id },
      data: {
        status: BookingStatus.COMPLETED,
        travelerConfirmedAt: now,
        updatedAt: now,
      },
    });

    const traveler = await this.prisma.users.findUnique({
      where: { id: booking.userId },
      select: { firstName: true, lastName: true }
    });

    await this.notificationService.notifyCompletionConfirmed(
      id,
      booking.packages.guides?.userId || "",
      `${traveler?.firstName || "Traveler"} ${traveler?.lastName || ""}`,
      guidePayout
    );

    const auditAction = releaseSource === ReleaseSource.AUTO_RELEASE
      ? 'payment.auto_released'
      : 'payment.released';

    this.audit.log({
      action: 'booking.completed',
      actorId: releaseSource === ReleaseSource.AUTO_RELEASE ? 'SYSTEM' : travelerId,
      resourceType: 'booking',
      resourceId: id,
      metadata: { totalPrice: booking.totalPrice, guidePayout, commission, commissionRate, releaseSource },
    });

    this.audit.log({
      action: auditAction,
      actorId: releaseSource === ReleaseSource.AUTO_RELEASE ? 'SYSTEM' : travelerId,
      resourceType: 'payment',
      resourceId: booking.payments?.id ?? id,
      metadata: {
        bookingId: id,
        amount: booking.totalPrice,
        payoutAmount: guidePayout,
        commission,
        releasedBy: releaseSource === ReleaseSource.AUTO_RELEASE ? 'SYSTEM' : travelerId,
        releaseSource,
        autoReleaseAt: booking.autoReleaseAt,
      },
    });

    return updated;
  }

  async raiseDispute(id: string, travelerId: string, body: DisputeDto) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: true } }, users: true },
    });
    
    if (booking.userId !== travelerId) {
      throw new ForbiddenException("Not your booking");
    }
    
    if (booking.status !== BookingStatus.AWAITING_TRAVELER_CONFIRMATION && booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException("Dispute can only be raised during active tour or awaiting confirmation");
    }
    
    const existingDispute = await this.prisma.disputes.findUnique({
      where: { bookingId: id },
    });
    
    if (existingDispute) {
      throw new BadRequestException("Dispute already exists for this booking");
    }
    
    await this.prisma.disputes.create({
      data: {
        id: this.uid(),
        bookingId: id,
        raisedBy: travelerId,
        reason: body.reason,
        description: body.description,
        status: DisputeStatus.OPEN,
        createdAt: this.ts(),
        updatedAt: this.ts(),
      },
    });
    
    const updated = await this.prisma.bookings.update({
      where: { id },
      data: {
        status: BookingStatus.DISPUTED,
        disputedAt: this.ts(),
        disputeReason: body.reason,
        updatedAt: this.ts(),
      },
    });
    
    const admins = await this.prisma.users.findMany({
      where: { role: UserRole.ADMIN },
    });
    
    for (const admin of admins) {
      await this.notificationService.notifyDisputeRaised(
        id,
        admin.id,
        `${booking.users?.firstName} ${booking.users?.lastName}`,
        body.reason
      );
    }

    this.audit.log({
      action: 'booking.disputed',
      actorId: travelerId,
      resourceType: 'booking',
      resourceId: id,
      metadata: { reason: body.reason },
    });

    return updated;
  }

  async resolveDispute(id: string, adminId: string, decision: string, adminNote: string) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { packages: { include: { guides: true } }, users: true, payments: true },
    });
    
    if (booking.status !== BookingStatus.DISPUTED) {
      throw new BadRequestException("Booking is not in disputed state");
    }
    
    let disputeStatus: DisputeStatus;
    let newBookingStatus: BookingStatus;
    let paymentAction: 'release' | 'refund' | 'partial' = 'refund';
    
    switch (decision) {
      case 'GUIDE_WINS':
        disputeStatus = DisputeStatus.RESOLVED_GUIDE_WINS;
        newBookingStatus = BookingStatus.COMPLETED;
        paymentAction = 'release';
        break;
      case 'TRAVELER_WINS':
        disputeStatus = DisputeStatus.RESOLVED_TRAVELER_WINS;
        newBookingStatus = BookingStatus.CANCELLED;
        paymentAction = 'refund';
        break;
      case 'PARTIAL':
        disputeStatus = DisputeStatus.RESOLVED_PARTIAL;
        newBookingStatus = BookingStatus.COMPLETED;
        paymentAction = 'partial';
        break;
      default:
        throw new BadRequestException("Invalid decision");
    }
    
    await this.prisma.disputes.update({
      where: { bookingId: id },
      data: {
        status: disputeStatus,
        adminNote,
        resolvedBy: adminId,
        resolvedAt: this.ts(),
        updatedAt: this.ts(),
      },
    });
    
    if (paymentAction === 'release' && booking.payments) {
      await this.prisma.payments.update({
        where: { bookingId: id },
        data: {
          status: PaymentStatus.RELEASED,
          releasedAt: this.ts(),
          updatedAt: this.ts(),
        },
      });
    } else if (paymentAction === 'refund' && booking.payments) {
      await this.prisma.payments.update({
        where: { bookingId: id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: this.ts(),
          updatedAt: this.ts(),
        },
      });
    }
    
    const updated = await this.prisma.bookings.update({
      where: { id },
      data: {
        status: newBookingStatus,
        adminResolvedAt: this.ts(),
        adminDecision: decision,
        updatedAt: this.ts(),
      },
    });
    
    await this.notificationService.notifyDisputeResolved(
      id,
      booking.userId,
      booking.packages.guides?.userId || "",
      decision
    );

    this.audit.log({
      action: 'booking.dispute_resolved',
      actorId: adminId,
      actorRole: 'ADMIN',
      resourceType: 'booking',
      resourceId: id,
      metadata: { decision, adminNote },
    });

    return updated;
  }

  bookings(userId: string, role: UserRole) {
    if (role === UserRole.TRAVELER)
      return this.prisma.bookings.findMany({
        where: { userId },
        include: { packages: { include: { guides: { include: { users: true } }, agencies: true } }, payments: true, disputes: true },
        orderBy: { createdAt: 'desc' },
      });
    
    if (role === UserRole.GUIDE)
      return this.prisma.bookings.findMany({
        where: { packages: { guides: { userId } } },
        include: { packages: { include: { guides: { include: { users: true } }, agencies: true } }, users: true, payments: true, disputes: true },
        orderBy: { createdAt: 'desc' },
      });
    
    return this.prisma.bookings.findMany({
      include: { packages: true, users: true, payments: true, disputes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bookingById(id: string, userId: string, role: UserRole) {
    const booking = await this.prisma.bookings.findUniqueOrThrow({
      where: { id },
      include: { 
        packages: { include: { guides: { include: { users: true } }, agencies: true } },
        users: true,
        payments: true,
        disputes: true,
      },
    });
    const pkg = booking.packages;
    const isAuthorized =
      role === UserRole.ADMIN ||
      booking.userId === userId ||
      pkg.guides?.userId === userId ||
      pkg.agencies?.userId === userId;
    
    if (!isAuthorized) throw new ForbiddenException("Not authorized");
    return booking;
  }

  async releasePayment(id: string) {
    const payment = await this.prisma.payments.findUniqueOrThrow({
      where: { id },
      include: { bookings: true },
    });
    if (payment.bookings.status !== BookingStatus.COMPLETED)
      throw new BadRequestException("Release only after completion");
    const updated = await this.prisma.payments.update({
      where: { id },
      data: {
        status: PaymentStatus.RELEASED,
        releasedAt: this.ts(),
        updatedAt: this.ts(),
      },
    });
    this.logger.log(
      JSON.stringify({
        event: "payment.released",
        paymentId: updated.id,
        bookingId: updated.bookingId,
        userId: updated.userId,
        amount: updated.amount,
        status: updated.status,
        timestamp: this.ts().toISOString(),
      }),
    );
    return updated;
  }

  // ============================================================
  // WEBHOOK HELPERS
  // ============================================================

  async findPaymentByProviderTxnId(providerTransactionId: string) {
    return this.prisma.payments.findFirst({
      where: { providerTransactionId },
    });
  }

  /** Called by webhook handler when gateway confirms SUCCESS. */
  async webhookConfirmPayment(paymentId: string, providerTransactionId: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { bookings: { include: { users: true } } },
    });
    if (!payment) return;

    const now = this.ts();
    await this.prisma.payments.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.HELD,
        providerTransactionId,
        updatedAt: now,
      },
    });

    if (payment.bookings.status === BookingStatus.PENDING) {
      await this.prisma.bookings.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.CONFIRMED, updatedAt: now },
      });
    }

    await this.notificationService.createNotification(
      payment.userId,
      NotificationType.PAYMENT_RECEIVED,
      'Payment Confirmed',
      `Your payment of Rs ${payment.amount.toLocaleString()} has been confirmed by the gateway. Booking is active.`,
      { bookingId: payment.bookingId, paymentId },
    );

    this.audit.log({
      action: 'payment.webhook_confirmed',
      actorId: 'SYSTEM',
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { bookingId: payment.bookingId, providerTransactionId },
    });
  }

  /** Called by webhook handler when gateway reports FAILED. */
  async webhookFailPayment(paymentId: string) {
    const payment = await this.prisma.payments.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    const now = this.ts();
    await this.prisma.payments.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, updatedAt: now },
    });

    await this.notificationService.createNotification(
      payment.userId,
      NotificationType.GENERAL,
      'Payment Failed',
      `Your payment for booking could not be processed by the gateway. Please try again.`,
      { bookingId: payment.bookingId, paymentId },
    );

    this.audit.log({
      action: 'payment.webhook_failed',
      actorId: 'SYSTEM',
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { bookingId: payment.bookingId },
    });
  }

  /**
   * SANDBOX TESTING ONLY — Force-confirm a payment for end-to-end testing.
   * In production, payment confirmation comes from the gateway webhook.
   * Remove or gate behind SANDBOX_MODE env var before go-live.
   */
  async sandboxConfirmPayment(paymentId: string) {
    const payment = await this.prisma.payments.findUniqueOrThrow({
      where: { id: paymentId },
    });

    await this.prisma.payments.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.HELD, updatedAt: this.ts() },
    });

    if (payment.bookingId) {
      const booking = await this.prisma.bookings.findUnique({ where: { id: payment.bookingId } });
      if (booking?.status === BookingStatus.PENDING) {
        await this.prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CONFIRMED, updatedAt: this.ts() },
        });
      }
    }

    this.audit.log({
      action: 'payment.sandbox_confirmed',
      actorId: 'ADMIN',
      resourceType: 'payment',
      resourceId: paymentId,
      metadata: { bookingId: payment.bookingId, sandboxMode: true },
    });

    return { message: 'Payment sandbox-confirmed', paymentId };
  }

  private async findConversationForPair(
    userId: string,
    otherUserId: string,
  ): Promise<{ id: string } | null> {
    const candidates = await this.prisma.conversations.findMany({
      where: { users: { some: { id: userId } } },
      select: { id: true, users: { select: { id: true } } },
    });
    return candidates.find(
      (c) => c.users.length === 2 && c.users.some((u) => u.id === otherUserId),
    )
      ? {
          id: candidates.find(
            (c) =>
              c.users.length === 2 && c.users.some((u) => u.id === otherUserId),
          )!.id,
        }
      : null;
  }

  async createConversation(userId: string, recipientId: string) {
    const existing = await this.findConversationForPair(userId, recipientId);
    if (existing) return existing;
    return this.prisma.conversations.create({
      data: {
        id: this.uid(),
        updatedAt: this.ts(),
        users: { connect: [{ id: userId }, { id: recipientId }] },
      },
    });
  }

  myConversations(userId: string) {
    return this.prisma.conversations.findMany({
      where: { users: { some: { id: userId } } },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
            guides: { select: { coverImage: true } },
            agencies: { select: { logo: true, name: true } },
          },
        },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  allConversations() {
    return this.prisma.conversations.findMany({
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  conversationMessages(id: string, userId: string, isAdmin: boolean) {
    return this.prisma.messages.findMany({
      where: {
        conversationId: id,
        ...(isAdmin
          ? {}
          : { conversations: { users: { some: { id: userId } } } }),
      },
      include: { users: true },
    });
  }

  async sendMessage(
    userId: string,
    body: { conversationId: string; content: string },
  ) {
    const conv = await this.prisma.conversations.findUniqueOrThrow({
      where: { id: body.conversationId },
      include: { users: { select: { id: true } } },
    });
    if (!conv.users.some((u) => u.id === userId))
      throw new ForbiddenException("Not a participant");

    // Safety scan for contact-bypass attempts
    const safety = checkMessageSafety(body.content);
    const finalContent = safety.isFlagged
      ? SAFETY_WARNING_PREFIX + body.content
      : body.content;

    const message = await this.prisma.messages.create({
      data: {
        id: this.uid(),
        conversationId: body.conversationId,
        senderId: userId,
        content: finalContent,
        ...(safety.isFlagged && { isFlagged: true }),
      },
    });

    if (safety.isFlagged) {
      this.audit.log({
        action: 'message.flagged',
        actorId: userId,
        resourceType: 'message',
        resourceId: message.id,
        metadata: {
          conversationId: body.conversationId,
          reasons: safety.reasons,
        },
      });
    }

    return message;
  }

  unreadMessages(userId: string) {
    return this.prisma.messages.count({
      where: {
        isRead: false,
        conversations: { users: { some: { id: userId } } },
        NOT: { senderId: userId },
      },
    });
  }

  notifications(userId: string) {
    return this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  unreadNotifications(userId: string) {
    return this.prisma.notifications.count({
      where: { userId, isRead: false },
    });
  }
  async readNotification(id: string, userId: string) {
    const n = await this.prisma.notifications.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException("Not found");
    return this.prisma.notifications.update({
      where: { id },
      data: { isRead: true },
    });
  }
  readAllNotifications(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }
  clearNotifications(userId: string) {
    return this.prisma.notifications.deleteMany({ where: { userId } });
  }

  report(userId: string, body: CreateReportDto) {
    return this.prisma.reports.create({
      data: {
        id: this.uid(),
        updatedAt: this.ts(),
        userId,
        type: body.type,
        targetId: body.targetId,
        reason: body.reason,
        description: body.details,
      },
    });
  }
  myReports(userId: string) {
    return this.prisma.reports.findMany({ where: { userId } });
  }

  myReviews(userId: string) {
    return this.prisma.reviews.findMany({
      where: { userId },
      include: { packages: true },
    });
  }
  reviewsByPackage(packageId: string) {
    return this.prisma.reviews.findMany({
      where: { packageId },
      include: { users: true },
    });
  }
  reviewsByGuide(guideId: string) {
    return this.prisma.reviews.findMany({
      where: { packages: { guideId } },
      include: { users: true, packages: true },
    });
  }
  reviewsByAgency(agencyId: string) {
    return this.prisma.reviews.findMany({
      where: { packages: { agencyId } },
      include: { users: true, packages: true },
    });
  }

  createReview(userId: string, body: CreateReviewDto) {
    return (async () => {
      const booking = await this.prisma.bookings.findUniqueOrThrow({
        where: { id: body.bookingId },
        include: { packages: true },
      });
      if (booking.userId !== userId) throw new ForbiddenException("Only owner");
      if (booking.status !== BookingStatus.COMPLETED)
        throw new BadRequestException("Only completed");
      if (booking.packageId !== body.packageId)
        throw new BadRequestException("Mismatch");
      const existing = await this.prisma.reviews.findUnique({
        where: { bookingId: body.bookingId },
      });
      if (existing) throw new BadRequestException("Duplicate");
      const review = await this.prisma.reviews.create({
        data: {
          id: this.uid(),
          updatedAt: this.ts(),
          userId,
          packageId: body.packageId,
          bookingId: body.bookingId,
          guideId: booking.packages.guideId,
          agencyId: booking.packages.agencyId,
          rating: body.rating,
          comment: body.comment,
        },
      });
      const agg = await this.prisma.reviews.aggregate({
        where: { packageId: body.packageId },
        _avg: { rating: true },
        _count: { id: true },
      });
      await this.prisma.packages.update({
        where: { id: body.packageId },
        data: {
          rating: agg._avg.rating ?? 0,
          totalReviews: agg._count.id,
          updatedAt: this.ts(),
        },
      });
      return review;
    })();
  }

  deleteReview(id: string, userId: string) {
    return (async () => {
      const existing = await this.prisma.reviews.findUniqueOrThrow({ where: { id } });
      if (existing.userId !== userId) throw new ForbiddenException('Not your review');
      const review = await this.prisma.reviews.delete({ where: { id } });
      const agg = await this.prisma.reviews.aggregate({
        where: { packageId: review.packageId },
        _avg: { rating: true },
        _count: { id: true },
      });
      await this.prisma.packages.update({
        where: { id: review.packageId },
        data: {
          rating: agg._avg.rating ?? 0,
          totalReviews: agg._count.id,
          updatedAt: this.ts(),
        },
      });
      return review;
    })();
  }

  wishlist(userId: string) {
    return this.prisma.wishlists.findMany({
      where: { userId },
      include: { packages: true },
    });
  }
  addWishlist(userId: string, packageId: string) {
    return this.prisma.wishlists.upsert({
      where: { userId_packageId: { userId, packageId } },
      update: {},
      create: { id: this.uid(), userId, packageId },
    });
  }
  removeWishlist(userId: string, packageId: string) {
    return this.prisma.wishlists.delete({
      where: { userId_packageId: { userId, packageId } },
    });
  }

  async adminStats() {
    const [
      users,
      pendingGuides,
      activeGuides,
      pendingAgencies,
      activeAgencies,
      pendingDisputes,
    ] = await Promise.all([
      this.prisma.users.count({ where: { isActive: true } }),
      this.prisma.guides.count({ where: { adminApproved: false } }),
      this.prisma.guides.count({ where: { adminApproved: true } }),
      this.prisma.agencies.count({ where: { adminApproved: false } }),
      this.prisma.agencies.count({ where: { adminApproved: true } }),
      this.prisma.disputes.count({ where: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } } }),
    ]);
    return {
      users,
      guides: { active: activeGuides, pending: pendingGuides },
      agencies: { active: activeAgencies, pending: pendingAgencies },
      pendingDisputes,
    };
  }

  adminUsers() {
    return this.prisma.users.findMany();
  }
  adminGuides() {
    return this.prisma.guides.findMany({ include: { users: true } });
  }
  async adminAgencies(params?: { page?: number; limit?: number }) {
    const page  = params?.page  ?? 1;
    const limit = params?.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.agencies.findMany({
        include: { users: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.agencies.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  adminPackages() {
    return this.prisma.packages.findMany({ include: { destinations: true } });
  }
  adminBookings() {
    return this.prisma.bookings.findMany({
      include: { users: true, packages: true, payments: true, disputes: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  adminReports() {
    return this.prisma.reports.findMany({ include: { users: true } });
  }
  adminDisputes() {
    return this.prisma.disputes.findMany({
      include: { bookings: { include: { users: true, packages: true } }, users: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUser(id: string) {
    const row = await this.prisma.users.findUniqueOrThrow({ where: { id } });
    return this.prisma.users.update({
      where: { id },
      data: { isActive: !row.isActive, updatedAt: this.ts() },
    });
  }
  
  verifyGuide(id: string, state: boolean) {
    return this.prisma.guides.update({
      where: { id },
      data: { isVerified: state, updatedAt: this.ts() },
    });
  }
  
  verifyAgency(id: string, state: boolean) {
    return this.prisma.agencies.update({
      where: { id },
      data: { isVerified: state, updatedAt: this.ts() },
    });
  }
  
  async togglePackage(id: string) {
    const row = await this.prisma.packages.findUniqueOrThrow({ where: { id } });
    return this.prisma.packages.update({
      where: { id },
      data: { isActive: !row.isActive, updatedAt: this.ts() },
    });
  }
  
  reportStatus(id: string, status: ReportStatus) {
    return this.prisma.reports.update({
      where: { id },
      data: { status, updatedAt: this.ts() },
    });
  }

  async userPrivacyForContact(
    viewerId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const allowed = await this.prisma.bookings.findFirst({
      where: {
        userId: viewerId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        packages: {
          OR: [
            { guides: { userId: targetUserId } },
            { agencies: { userId: targetUserId } },
          ],
        },
      },
    });
    return Boolean(allowed);
  }

  async getUserPublic(userId: string, viewerId?: string) {
    const user = await this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
    });
    const canView = viewerId
      ? await this.userPrivacyForContact(viewerId, userId)
      : false;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: canView ? user.phone : null,
      email: canView ? user.email : null,
    };
  }

  // ============================================
  // GUIDE APPROVAL METHODS
  // ============================================

  async getPendingGuides() {
    return this.prisma.guides.findMany({
      where: { adminApproved: false },
      include: { users: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveGuide(guideId: string) {
    const guide = await this.prisma.guides.findUnique({
      where: { id: guideId },
      include: { users: true },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    const freePeriodEndsAt = new Date();
    freePeriodEndsAt.setMonth(freePeriodEndsAt.getMonth() + 3);

    const updated = await this.prisma.guides.update({
      where: { id: guideId },
      data: {
        adminApproved: true,
        approvalDate: this.ts(),
        freePeriodEndsAt,
        isVerified: true,
        updatedAt: this.ts(),
      },
    });

    await this.notificationService.notifyGuideApproved(
      guide.userId,
      `${guide.users?.firstName} ${guide.users?.lastName}`,
      freePeriodEndsAt
    );

    return updated;
  }

  async rejectGuide(guideId: string, reason: string) {
    const guide = await this.prisma.guides.findUnique({
      where: { id: guideId },
      include: { users: true },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    await this.notificationService.notifyGuideRejected(
      guide.userId,
      `${guide.users?.firstName} ${guide.users?.lastName}`,
      reason
    );

    return { message: 'Guide rejected', reason };
  }

  async getGuideApprovalStatus(userId: string) {
    const guide = await this.prisma.guides.findUnique({
      where: { userId },
      select: {
        adminApproved: true,
        approvalDate: true,
        freePeriodEndsAt: true,
        isVerified: true,
      },
    });

    if (!guide) throw new NotFoundException('Guide profile not found');

    return guide;
  }

  // ============================================
  // AGENCY APPROVAL METHODS
  // ============================================

  async getPendingAgencies() {
    return this.prisma.agencies.findMany({
      where: { adminApproved: false },
      include: { users: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveAgencyDocuments(agencyId: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
      include: { users: true },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const freePeriodEndsAt = new Date();
    freePeriodEndsAt.setMonth(freePeriodEndsAt.getMonth() + 3);

    const updated = await this.prisma.agencies.update({
      where: { id: agencyId },
      data: {
        adminApproved: true,
        approvalDate: this.ts(),
        freePeriodEndsAt,
        subscriptionStatus: 'FREE_TRIAL',
        isVerified: true,
        updatedAt: this.ts(),
      },
    });

    await this.notificationService.notifyAgencyDocumentsApproved(
      agency.userId,
      agency.name,
      freePeriodEndsAt
    );

    return updated;
  }

  async rejectAgencyDocuments(agencyId: string, reason: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { id: agencyId },
      include: { users: true },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    await this.createNotification(
      agency.userId,
      NotificationType.GENERAL,
      'Document Rejection',
      `Your agency documents were rejected. Reason: ${reason}. Please upload correct documents.`,
      { reason }
    );

    return { message: 'Agency documents rejected', reason };
  }

  async getAgencyApprovalStatus(userId: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { userId },
      select: {
        adminApproved: true,
        approvalDate: true,
        freePeriodEndsAt: true,
        subscriptionStatus: true,
        isVerified: true,
      },
    });

    if (!agency) throw new NotFoundException('Agency profile not found');

    return agency;
  }

  // ============================================
  // AGENCY SUBSCRIPTION MANAGEMENT
  // ============================================

  async getExpiringSubscriptions() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return this.prisma.agencies.findMany({
      where: {
        subscriptionStatus: 'FREE_TRIAL',
        freePeriodEndsAt: {
          lte: threeDaysFromNow,
          gt: new Date(),
        },
      },
      include: { users: true },
    });
  }

  async getMySubscription(userId: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        freePeriodEndsAt: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    return agency;
  }

  async paySubscription(userId: string, body: { paymentMethod: string; transactionId: string; proofUrl?: string }) {
    const agency = await this.prisma.agencies.findUnique({
      where: { userId },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const { PLATFORM_CONFIG } = await import('../../common/config/platform.config');
    const amount = PLATFORM_CONFIG.agencySubscriptionAmount;
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Store proof URL in transactionId if provided (schema reuse — no migration needed)
    const txId = body.proofUrl
      ? `PROOF:${body.proofUrl}|REF:${body.transactionId || ''}`
      : body.transactionId;

    const payment = await this.prisma.agency_subscription_payments.create({
      data: {
        id: this.uid(),
        agencyId: agency.id,
        amount,
        paymentMethod: body.paymentMethod as any,
        transactionId: txId,
        // PENDING_REVIEW — admin must approve before activating
        status: 'PENDING_REVIEW',
        periodStart,
        periodEnd,
        userId,
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'subscription.proof_submitted',
        agencyId: agency.id,
        paymentId: payment.id,
        timestamp: this.ts().toISOString(),
      }),
    );

    return { message: 'Payment proof submitted. Awaiting admin review.', payment };
  }

  async getPendingSubscriptionProofs() {
    return this.prisma.agency_subscription_payments.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        agencies: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionStatus: true,
            users: { select: { email: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveSubscriptionPayment(paymentId: string) {
    const payment = await this.prisma.agency_subscription_payments.findUnique({
      where: { id: paymentId },
      include: { agencies: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    await this.prisma.agency_subscription_payments.update({
      where: { id: paymentId },
      data: { status: SubscriptionPaymentStatus.APPROVED },
    });

    const updated = await this.prisma.agencies.update({
      where: { id: payment.agencyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: payment.periodStart,
        subscriptionEndDate: payment.periodEnd,
        updatedAt: this.ts(),
      },
    });

    await this.notificationService.notifyAgencySubscriptionConfirmed(
      payment.agencies.userId,
      payment.agencies.name,
      payment.periodEnd,
    );

    this.audit.log({
      action: 'subscription.approved',
      resourceType: 'agency_subscription_payment',
      resourceId: paymentId,
      metadata: {
        agencyId: payment.agencyId,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
      },
    });

    return updated;
  }

  async rejectSubscriptionPayment(paymentId: string, reason: string) {
    const payment = await this.prisma.agency_subscription_payments.findUnique({
      where: { id: paymentId },
      include: { agencies: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    await this.prisma.agency_subscription_payments.update({
      where: { id: paymentId },
      data: {
        status: SubscriptionPaymentStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    // Notify agency of rejection with reason
    if (payment.agencies?.userId) {
      await this.notificationService.createNotification(
        payment.agencies.userId,
        NotificationType.PAYMENT_PROOF_REJECTED,
        'Subscription Payment Rejected',
        `Your subscription payment has been rejected. Reason: ${reason}. Please resubmit.`,
        { paymentId, reason },
      );
    }

    this.audit.log({
      action: 'subscription.rejected',
      resourceType: 'agency_subscription_payment',
      resourceId: paymentId,
      metadata: { agencyId: payment.agencyId, reason },
    });

    return { message: 'Payment rejected', reason };
  }

  async updateSubscriptionStatus(agencyId: string, status: string) {
    return this.prisma.agencies.update({
      where: { id: agencyId },
      data: {
        subscriptionStatus: status as any,
        updatedAt: this.ts(),
      },
    });
  }

  async recordSubscriptionPayment(
    agencyId: string,
    dto: AgencySubscriptionPaymentDto,
  ) {
    const agency = await this.prisma.agencies.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');

    // Amount is ALWAYS from PLATFORM_CONFIG — never trust submitted amount.
    const amount = PLATFORM_CONFIG.agencySubscriptionAmount;
    const periodStart = new Date();
    const periodEnd = new Date(periodStart.getTime() + PLATFORM_CONFIG.subscriptionPeriodDays * 86_400_000);

    const localRef = `SUB-${agencyId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // For mobile wallet / card: get a provider reference
    const provider = this.paymentProviders.getProvider(dto.paymentMethod);
    const providerResult = await provider.initiatePayment({
      bookingId: agencyId, // used as context identifier
      userId: agency.userId,
      amount,
      currency: PLATFORM_CONFIG.currency,
      reference: localRef,
      mobileNumber: dto.mobileNumber,
      cardToken: dto.cardToken,
      bankReference: dto.bankReference,
      proofUrl: dto.proofUrl,
    });

    // Bank Transfer: start as PENDING_REVIEW; others: APPROVED immediately in sandbox
    const initialStatus =
      dto.paymentMethod === PaymentMethod.BANK_TRANSFER
        ? SubscriptionPaymentStatus.PENDING_REVIEW
        : SubscriptionPaymentStatus.APPROVED;

    const payment = await this.prisma.agency_subscription_payments.create({
      data: {
        id: this.uid(),
        agencyId,
        amount,
        paymentMethod: dto.paymentMethod,
        transactionId: providerResult.providerTransactionId || localRef,
        proofUrl: dto.proofUrl ?? null,
        status: initialStatus,
        periodStart,
        periodEnd,
        userId: agency.userId,
      },
    });

    // Only activate subscription when payment is approved
    if (initialStatus === SubscriptionPaymentStatus.APPROVED) {
      await this.prisma.agencies.update({
        where: { id: agencyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: periodStart,
          subscriptionEndDate: periodEnd,
          updatedAt: this.ts(),
        },
      });
      await this.notificationService.notifyAgencySubscriptionConfirmed(
        agency.userId,
        agency.name,
        periodEnd,
      );
    } else {
      // Notify agency that proof is under review
      await this.notificationService.createNotification(
        agency.userId,
        NotificationType.PAYMENT_PROOF_SUBMITTED,
        'Subscription Payment Under Review',
        `Your subscription payment of Rs ${amount.toLocaleString()} is under review. You will be notified within 24 hours.`,
        { paymentId: payment.id },
      );
      await this.prisma.agencies.update({
        where: { id: agencyId },
        data: {
          subscriptionStatus: 'PENDING_REVIEW',
          updatedAt: this.ts(),
        },
      });
    }

    this.audit.log({
      action: 'subscription.payment_recorded',
      actorId: agency.userId,
      resourceType: 'agency_subscription_payment',
      resourceId: payment.id,
      metadata: { agencyId, amount, paymentMethod: dto.paymentMethod, status: initialStatus },
    });

    return {
      payment,
      message:
        initialStatus === SubscriptionPaymentStatus.APPROVED
          ? 'Subscription activated successfully.'
          : 'Payment submitted for review. Your subscription will be activated once verified.',
    };
  }

  async getSubscriptionHistory() {
    return this.prisma.agency_subscription_payments.findMany({
      include: {
        agencies: {
          select: {
            name: true,
            users: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // COMMISSION MANAGEMENT
  // ============================================

  async getCommissionHistory(userId: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { userId },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    return this.prisma.agency_commission_payments.findMany({
      where: { agencyId: agency.id },
      include: {
        bookings: {
          include: {
            packages: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payCommission(userId: string, bookingId: string, transactionId: string) {
    const agency = await this.prisma.agencies.findUnique({
      where: { userId },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const commission = await this.prisma.agency_commission_payments.findFirst({
      where: {
        agencyId: agency.id,
        bookingId,
        status: 'PENDING',
      },
    });

    if (!commission) throw new NotFoundException('Commission record not found');

    const updated = await this.prisma.agency_commission_payments.update({
      where: { id: commission.id },
      data: {
        status: 'PAID',
        paidAt: this.ts(),
        updatedAt: this.ts(),
      },
    });

    return updated;
  }

  async getPendingCommissions() {
    return this.prisma.agency_commission_payments.findMany({
      where: { status: 'PENDING' },
      include: {
        agencies: { include: { users: true } },
        bookings: { include: { packages: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markCommissionPaid(commissionId: string, transactionId: string) {
    const commission = await this.prisma.agency_commission_payments.findUnique({
      where: { id: commissionId },
    });

    if (!commission) throw new NotFoundException('Commission record not found');

    const updated = await this.prisma.agency_commission_payments.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: this.ts(),
        updatedAt: this.ts(),
      },
    });

    return updated;
  }

  // ============================================
  // INTERNATIONAL BOOKING HANDLING
  // (Renamed from "Manual Booking" — payment method: BANK_TRANSFER)
  // ============================================

  async getPendingInternationalBookings() {
    return this.prisma.bookings.findMany({
      where: {
        isInternational: true,
        internationalBookingStatus: InternationalBookingStatus.PENDING_REVIEW,
      },
      include: {
        users: true,
        packages: { include: { destinations: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** @deprecated use getPendingInternationalBookings */
  async getPendingManualBookings() {
    return this.getPendingInternationalBookings();
  }

  async assignWhatsAppToInternationalBooking(body: { bookingId: string; whatsappId?: string; notes?: string }) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: body.bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.bookings.update({
      where: { id: body.bookingId },
      data: {
        whatsappConversationId: body.whatsappId,
        notes: body.notes ? `${booking.notes || ''}\n[Admin]: ${body.notes}` : booking.notes,
        internationalBookingStatus: InternationalBookingStatus.AWAITING_PAYMENT,
        updatedAt: this.ts(),
      },
    });
  }

  /** @deprecated use assignWhatsAppToInternationalBooking */
  async assignWhatsAppToManualBooking(body: { bookingId: string; whatsappId?: string; notes?: string }) {
    return this.assignWhatsAppToInternationalBooking(body);
  }

  async markInternationalBookingPaid(body: { bookingId: string; transactionId: string; notes?: string }) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: body.bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.bookings.update({
      where: { id: body.bookingId },
      data: {
        internationalBookingStatus: InternationalBookingStatus.PAYMENT_RECEIVED,
        notes: body.notes ? `${booking.notes || ''}\n[Payment]: ${body.notes}` : booking.notes,
        updatedAt: this.ts(),
      },
    });
  }

  /** @deprecated use markInternationalBookingPaid */
  async markManualBookingPaid(body: { bookingId: string; transactionId: string; notes?: string }) {
    return this.markInternationalBookingPaid(body);
  }

  async assignGuideToInternationalBooking(
    body: { bookingId: string; guideId: string; notes?: string },
    adminUserId: string,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: body.bookingId },
      include: { users: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const guide = await this.prisma.guides.findUnique({
      where: { id: body.guideId },
      include: { users: true },
    });
    if (!guide) throw new NotFoundException('Guide not found');

    await this.prisma.international_booking_assignments.create({
      data: {
        id: this.uid(),
        bookingId: body.bookingId,
        assignedBy: adminUserId,
        assignedTo: guide.userId,
        notes: body.notes,
        updatedAt: this.ts(),
      },
    });

    const updated = await this.prisma.bookings.update({
      where: { id: body.bookingId },
      data: {
        internationalBookingStatus: InternationalBookingStatus.GUIDE_ASSIGNED,
        notes: body.notes ? `${booking.notes || ''}\n[Guide Assignment]: ${body.notes}` : booking.notes,
        updatedAt: this.ts(),
      },
    });

    await this.notificationService.notifyInternationalBookingPaymentReceived(
      body.bookingId,
      guide.userId,
      booking.users?.firstName || 'Traveler',
      booking.totalPrice,
    );

    return updated;
  }

  /** @deprecated use assignGuideToInternationalBooking */
  async assignGuideToManualBooking(body: { bookingId: string; guideId: string; notes?: string }, adminUserId: string) {
    return this.assignGuideToInternationalBooking(body, adminUserId);
  }

  async completeInternationalBooking(bookingId: string) {
    return this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        internationalBookingStatus: InternationalBookingStatus.COMPLETED,
        status: BookingStatus.COMPLETED,
        updatedAt: this.ts(),
      },
    });
  }

  /** @deprecated use completeInternationalBooking */
  async completeManualBooking(bookingId: string) {
    return this.completeInternationalBooking(bookingId);
  }

  async cancelInternationalBooking(bookingId: string) {
    return this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        internationalBookingStatus: InternationalBookingStatus.CANCELLED,
        status: BookingStatus.CANCELLED,
        updatedAt: this.ts(),
      },
    });
  }

  /** @deprecated use cancelInternationalBooking */
  async cancelManualBooking(bookingId: string) {
    return this.cancelInternationalBooking(bookingId);
  }

  async getAllGuides() {
    return this.prisma.guides.findMany({
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // HELPER: CREATE NOTIFICATION
  // ============================================

  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ) {
    return this.prisma.notifications.create({
      data: {
        id: this.uid(),
        userId,
        type,
        title,
        body,
        data: data || {},
        createdAt: this.ts(),
      },
    });
  }
}