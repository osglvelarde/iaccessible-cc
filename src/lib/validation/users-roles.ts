import { CreateUserRequest, CreateGroupRequest, CreateOperatingUnitRequest, CreateOrganizationRequest } from '../types/users-roles';

/**
 * Validation utilities for users and roles
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from URL or return domain as-is
 */
export function extractDomain(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // If it's a URL, extract the domain
  try {
    // Check if it looks like a URL (starts with http:// or https://)
    if (trimmed.match(/^https?:\/\//i)) {
      const url = new URL(trimmed);
      return url.hostname;
    }
    // Check if it has a path (contains /)
    if (trimmed.includes('/')) {
      // Try to parse as URL without protocol
      const url = new URL('http://' + trimmed);
      return url.hostname;
    }
  } catch (e) {
    // Not a valid URL, treat as domain
  }
  
  // Return as-is if it's already a domain
  return trimmed.toLowerCase();
}

/**
 * Validate domain format
 * More lenient validation - allows common domain patterns
 * Also handles URLs by extracting the domain
 */
export function validateDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;
  
  // Extract domain from URL if needed
  const extractedDomain = extractDomain(domain);
  
  if (!extractedDomain) return false;
  
  // Basic domain validation - allows subdomains, hyphens, etc.
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainRegex.test(extractedDomain) && extractedDomain.length >= 4; // At least "a.co"
}

/**
 * Validate slug format (URL-friendly identifier)
 * Allows lowercase letters, numbers, and hyphens
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  // Convert to lowercase and trim for validation
  const normalized = slug.toLowerCase().trim();
  // Must start and end with alphanumeric, can have hyphens in between
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(normalized) && normalized.length >= 2;
}

/**
 * Validate user creation request
 */
export function validateUserCreation(data: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  if (!data.email || !data.email.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.firstName || !data.firstName.trim()) {
    errors.push('First name is required');
  } else if (data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!data.lastName || !data.lastName.trim()) {
    errors.push('Last name is required');
  } else if (data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  if (!data.operatingUnitId || !data.operatingUnitId.trim()) {
    errors.push('Operating unit is required');
  }

  if (data.groupIds && !Array.isArray(data.groupIds)) {
    errors.push('Group IDs must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate organization creation request
 */
export function validateOrganizationCreation(data: CreateOrganizationRequest): ValidationResult {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Organization name is required');
  } else if (data.name.trim().length < 3) {
    errors.push('Organization name must be at least 3 characters');
  }

  if (!data.slug || !data.slug.trim()) {
    errors.push('Organization slug is required');
  } else {
    // Normalize slug for validation (lowercase, trim)
    const normalizedSlug = data.slug.toLowerCase().trim();
    if (!validateSlug(normalizedSlug)) {
      errors.push(`Invalid slug format: "${data.slug}". Use lowercase letters, numbers, and hyphens only (e.g., "my-org-123")`);
    }
  }

  if (!data.domains || !Array.isArray(data.domains) || data.domains.length === 0) {
    errors.push('At least one domain is required');
  } else {
    data.domains.forEach((domain, index) => {
      if (!domain || !domain.trim()) {
        errors.push(`Domain at index ${index} is empty`);
      } else {
        // Extract domain from URL if needed
        const extractedDomain = extractDomain(domain);
        if (!extractedDomain) {
          errors.push(`Invalid domain format: ${domain}`);
        } else if (!validateDomain(extractedDomain)) {
          errors.push(`Invalid domain format: ${domain} (extracted: ${extractedDomain})`);
        }
      }
    });
  }

  if (data.settings) {
    if (data.settings.maxUsers !== undefined && data.settings.maxUsers < 1) {
      errors.push('Max users must be at least 1');
    }
    if (data.settings.maxOperatingUnits !== undefined && data.settings.maxOperatingUnits < 1) {
      errors.push('Max operating units must be at least 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate operating unit creation request
 */
export function validateOperatingUnitCreation(data: CreateOperatingUnitRequest): ValidationResult {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Operating unit name is required');
  } else if (data.name.trim().length < 3) {
    errors.push('Operating unit name must be at least 3 characters');
  }

  if (!data.organization || !data.organization.trim()) {
    errors.push('Organization name is required');
  }

  if (!data.organizationId || !data.organizationId.trim()) {
    errors.push('Organization ID is required');
  }

  if (!data.domains || !Array.isArray(data.domains) || data.domains.length === 0) {
    errors.push('At least one domain is required');
  } else {
    data.domains.forEach((domain, index) => {
      if (!domain || !domain.trim()) {
        errors.push(`Domain at index ${index} is empty`);
      } else {
        // Extract domain from URL if needed
        const extractedDomain = extractDomain(domain);
        if (!extractedDomain) {
          errors.push(`Invalid domain format: ${domain}`);
        } else if (!validateDomain(extractedDomain)) {
          errors.push(`Invalid domain format: ${domain} (extracted: ${extractedDomain})`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate group creation request
 */
export function validateGroupCreation(data: CreateGroupRequest): ValidationResult {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Group name is required');
  } else if (data.name.trim().length < 3) {
    errors.push('Group name must be at least 3 characters');
  }

  if (!data.organizationId || !data.organizationId.trim()) {
    errors.push('Organization ID is required');
  }

  if (!data.permissions || !Array.isArray(data.permissions)) {
    errors.push('Permissions must be an array');
  } else if (data.permissions.length === 0) {
    errors.push('At least one permission is required');
  } else {
    data.permissions.forEach((permission, index) => {
      if (!permission.moduleKey) {
        errors.push(`Permission at index ${index} is missing moduleKey`);
      }
      if (!permission.accessLevel || !['none', 'read', 'write', 'execute'].includes(permission.accessLevel)) {
        errors.push(`Permission at index ${index} has invalid accessLevel`);
      }
      if (!permission.features || !Array.isArray(permission.features)) {
        errors.push(`Permission at index ${index} is missing features array`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

