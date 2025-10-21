import { 
  UserGroup, 
  ModulePermission, 
  AccessLevel, 
  FeaturePermission,
  PermissionInheritanceRule,
  InheritedPermission,
  PermissionInheritanceConfig,
  Organization,
  OperatingUnit
} from '@/lib/types/users-roles';

// Permission inheritance utilities
export class PermissionInheritanceManager {
  private inheritanceConfigs: Map<string, PermissionInheritanceConfig> = new Map();

  /**
   * Calculate inherited permissions for an operating unit based on organization-level groups
   */
  calculateInheritedPermissions(
    organizationGroups: UserGroup[],
    operatingUnitGroups: UserGroup[],
    inheritanceConfig: PermissionInheritanceConfig,
    operatingUnitId: string
  ): InheritedPermission[] {
    const inheritedPermissions: InheritedPermission[] = [];

    // Get organization-level groups that should be inherited
    const orgGroupsToInherit = organizationGroups.filter(group => 
      group.scope === 'organization' && 
      group.organizationId === inheritanceConfig.organizationId
    );

    for (const orgGroup of orgGroupsToInherit) {
      for (const modulePermission of orgGroup.permissions) {
        const inheritanceRule = this.findInheritanceRule(
          inheritanceConfig, 
          modulePermission.moduleKey
        );

        if (inheritanceRule && inheritanceRule.inheritLevel !== 'none') {
          const inheritedPermission = this.createInheritedPermission(
            modulePermission,
            orgGroup,
            inheritanceRule,
            operatingUnitId
          );

          // Check if this permission is already explicitly defined at OU level
          const hasExplicitPermission = this.hasExplicitPermission(
            operatingUnitGroups,
            modulePermission.moduleKey
          );

          if (!hasExplicitPermission || inheritanceRule.inheritLevel === 'full') {
            inheritedPermissions.push(inheritedPermission);
          }
        }
      }
    }

    return inheritedPermissions;
  }

  /**
   * Merge inherited permissions with explicit OU permissions
   */
  mergePermissions(
    explicitPermissions: ModulePermission[],
    inheritedPermissions: InheritedPermission[]
  ): ModulePermission[] {
    const mergedPermissions: ModulePermission[] = [...explicitPermissions];
    const explicitModuleKeys = new Set(explicitPermissions.map(p => p.moduleKey));

    for (const inherited of inheritedPermissions) {
      if (!explicitModuleKeys.has(inherited.moduleKey)) {
        // Add inherited permission as new module permission
        mergedPermissions.push({
          moduleKey: inherited.moduleKey,
          moduleName: inherited.moduleName,
          accessLevel: inherited.accessLevel,
          features: inherited.features
        });
      } else {
        // Merge with existing explicit permission
        const existingIndex = mergedPermissions.findIndex(p => p.moduleKey === inherited.moduleKey);
        if (existingIndex !== -1) {
          mergedPermissions[existingIndex] = this.mergeModulePermissions(
            mergedPermissions[existingIndex],
            inherited
          );
        }
      }
    }

    return mergedPermissions;
  }

  /**
   * Create a default inheritance configuration for an organization
   */
  createDefaultInheritanceConfig(organizationId: string): PermissionInheritanceConfig {
    return {
      organizationId,
      enableInheritance: true,
      defaultInheritanceLevel: 'partial',
      rules: this.createDefaultInheritanceRules(organizationId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Create default inheritance rules for common modules
   */
  private createDefaultInheritanceRules(organizationId: string): PermissionInheritanceRule[] {
    const commonModules = [
      'usersRoles',
      'scans',
      'reports',
      'settings',
      'audit'
    ];

    return commonModules.map(moduleKey => ({
      id: `rule-${organizationId}-${moduleKey}`,
      organizationId,
      sourceScope: 'organization',
      targetScope: 'operating_unit',
      moduleKey,
      inheritLevel: 'partial',
      restrictions: {
        accessLevel: 'read' // Default to read-only inheritance
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    }));
  }

  /**
   * Find inheritance rule for a specific module
   */
  private findInheritanceRule(
    config: PermissionInheritanceConfig,
    moduleKey: string
  ): PermissionInheritanceRule | undefined {
    return config.rules.find(rule => rule.moduleKey === moduleKey);
  }

  /**
   * Create inherited permission from organization group
   */
  private createInheritedPermission(
    modulePermission: ModulePermission,
    orgGroup: UserGroup,
    rule: PermissionInheritanceRule,
    operatingUnitId: string
  ): InheritedPermission {
    let inheritedAccessLevel = modulePermission.accessLevel;
    let inheritedFeatures = [...modulePermission.features];

    // Apply inheritance restrictions
    if (rule.restrictions) {
      if (rule.restrictions.accessLevel) {
        inheritedAccessLevel = this.getRestrictedAccessLevel(
          modulePermission.accessLevel,
          rule.restrictions.accessLevel
        );
      }

      if (rule.restrictions.features && rule.inheritLevel === 'partial') {
        inheritedFeatures = modulePermission.features.filter(feature =>
          rule.restrictions!.features!.includes(feature.featureKey)
        );
      }
    }

    return {
      moduleKey: modulePermission.moduleKey,
      moduleName: modulePermission.moduleName,
      accessLevel: inheritedAccessLevel,
      features: inheritedFeatures,
      inheritedFrom: 'organization',
      inheritedFromId: orgGroup.id,
      inheritanceRule: rule
    };
  }

  /**
   * Check if operating unit has explicit permission for a module
   */
  private hasExplicitPermission(
    operatingUnitGroups: UserGroup[],
    moduleKey: string
  ): boolean {
    return operatingUnitGroups.some(group =>
      group.permissions.some(permission => permission.moduleKey === moduleKey)
    );
  }

  /**
   * Merge module permissions (explicit + inherited)
   */
  private mergeModulePermissions(
    explicit: ModulePermission,
    inherited: InheritedPermission
  ): ModulePermission {
    // Use the higher access level
    const mergedAccessLevel = this.getHigherAccessLevel(
      explicit.accessLevel,
      inherited.accessLevel
    );

    // Merge features, preferring explicit over inherited
    const explicitFeatureKeys = new Set(explicit.features.map(f => f.featureKey));
    const mergedFeatures = [
      ...explicit.features,
      ...inherited.features.filter(f => !explicitFeatureKeys.has(f.featureKey))
    ];

    return {
      moduleKey: explicit.moduleKey,
      moduleName: explicit.moduleName,
      accessLevel: mergedAccessLevel,
      features: mergedFeatures
    };
  }

  /**
   * Get restricted access level (lower of the two)
   */
  private getRestrictedAccessLevel(
    original: AccessLevel,
    restriction: AccessLevel
  ): AccessLevel {
    const levelHierarchy: Record<AccessLevel, number> = {
      'none': 0,
      'read': 1,
      'write': 2,
      'execute': 3
    };

    return levelHierarchy[original] <= levelHierarchy[restriction] ? original : restriction;
  }

  /**
   * Get higher access level
   */
  private getHigherAccessLevel(
    level1: AccessLevel,
    level2: AccessLevel
  ): AccessLevel {
    const levelHierarchy: Record<AccessLevel, number> = {
      'none': 0,
      'read': 1,
      'write': 2,
      'execute': 3
    };

    return levelHierarchy[level1] >= levelHierarchy[level2] ? level1 : level2;
  }

  /**
   * Validate inheritance configuration
   */
  validateInheritanceConfig(config: PermissionInheritanceConfig): string[] {
    const errors: string[] = [];

    if (!config.organizationId) {
      errors.push('Organization ID is required');
    }

    if (config.enableInheritance && config.rules.length === 0) {
      errors.push('At least one inheritance rule is required when inheritance is enabled');
    }

    // Check for duplicate rules
    const moduleKeys = config.rules.map(rule => rule.moduleKey);
    const duplicateKeys = moduleKeys.filter((key, index) => moduleKeys.indexOf(key) !== index);
    if (duplicateKeys.length > 0) {
      errors.push(`Duplicate inheritance rules found for modules: ${duplicateKeys.join(', ')}`);
    }

    return errors;
  }

  /**
   * Get effective permissions for a user considering inheritance
   */
  getEffectivePermissionsWithInheritance(
    user: { groups: UserGroup[] },
    organizationGroups: UserGroup[],
    inheritanceConfig: PermissionInheritanceConfig,
    operatingUnitId: string
  ): ModulePermission[] {
    const userGroups = user.groups;
    const ouGroups = userGroups.filter(group => group.scope === 'operating_unit');
    const orgGroups = userGroups.filter(group => group.scope === 'organization');

    // Get explicit OU permissions
    const explicitPermissions: ModulePermission[] = [];
    for (const group of ouGroups) {
      explicitPermissions.push(...group.permissions);
    }

    // Calculate inherited permissions
    const inheritedPermissions = this.calculateInheritedPermissions(
      organizationGroups,
      ouGroups,
      inheritanceConfig,
      operatingUnitId
    );

    // Merge permissions
    return this.mergePermissions(explicitPermissions, inheritedPermissions);
  }
}

// Export singleton instance
export const permissionInheritanceManager = new PermissionInheritanceManager();

// Utility functions
export function createInheritanceConfig(organizationId: string): PermissionInheritanceConfig {
  return permissionInheritanceManager.createDefaultInheritanceConfig(organizationId);
}

export function calculateInheritedPermissions(
  organizationGroups: UserGroup[],
  operatingUnitGroups: UserGroup[],
  inheritanceConfig: PermissionInheritanceConfig,
  operatingUnitId: string
): InheritedPermission[] {
  return permissionInheritanceManager.calculateInheritedPermissions(
    organizationGroups,
    operatingUnitGroups,
    inheritanceConfig,
    operatingUnitId
  );
}

export function getEffectivePermissionsWithInheritance(
  user: { groups: UserGroup[] },
  organizationGroups: UserGroup[],
  inheritanceConfig: PermissionInheritanceConfig,
  operatingUnitId: string
): ModulePermission[] {
  return permissionInheritanceManager.getEffectivePermissionsWithInheritance(
    user,
    organizationGroups,
    inheritanceConfig,
    operatingUnitId
  );
}
