import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CustomRouteTableProps {
  vpcId: string;
  cidrBlock: string;
  availabilityZone: string;
  routeEntries?: RouteEntry[];
  subnetTags?: { [key: string]: string };
  routeTableTags?: { [key: string]: string };
}

export interface RouteEntry {
  destinationCidr: string;
  targetType: 'tgw' | 'vpc-endpoint' | 'internet-gateway' | 'nat-gateway';
  targetId: string;
}

export class SubnetWithRouteTable extends Construct {
  public readonly subnet: ec2.CfnSubnet;
  public readonly routeTable: ec2.CfnRouteTable;

  constructor(scope: Construct, id: string, props: CustomRouteTableProps) {
    super(scope, id);

    // Create the subnet with tags
    this.subnet = new ec2.CfnSubnet(this, 'Subnet', {
      vpcId: props.vpcId,
      cidrBlock: props.cidrBlock,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: false, // Set to true if you want public IPs for instances
      tags: this.convertTagsToCdkFormat(props.subnetTags),
    });

    // Create the route table with tags
    this.routeTable = new ec2.CfnRouteTable(this, 'RouteTable', {
      vpcId: props.vpcId,
      tags: this.convertTagsToCdkFormat(props.routeTableTags),
    });

    // Associate the route table with the subnet
    new ec2.CfnSubnetRouteTableAssociation(this, 'SubnetRouteTableAssoc', {
      subnetId: this.subnet.ref,
      routeTableId: this.routeTable.ref,
    });

    // Add initial route table entries if provided
    if (props.routeEntries) {
      this.addRouteTableEntries(props.routeEntries);
    }
  }

  /**
   * Adds route entries to the route table.
   * @param routeEntries List of route entries to add
   */
  public addRouteTableEntries(routeEntries: RouteEntry[]): void {
    routeEntries.forEach((entry, index) => {
      new ec2.CfnRoute(this, `Route${index}`, {
        routeTableId: this.routeTable.ref,
        destinationCidrBlock: entry.destinationCidr,
        ...this.resolveTarget(entry),
      });
    });
  }

  /**
   * Resolves the target for the route entry based on the target type.
   * @param entry The route entry to resolve
   */
  private resolveTarget(entry: RouteEntry): any {
    switch (entry.targetType) {
      case 'tgw':
        return { transitGatewayId: entry.targetId };
      case 'vpc-endpoint':
        return { vpcEndpointId: entry.targetId };
      case 'internet-gateway':
        return { gatewayId: entry.targetId };
      case 'nat-gateway':
        return { natGatewayId: entry.targetId };
      default:
        throw new Error(`Unsupported target type: ${entry.targetType}`);
    }
  }

  /**
   * Converts a plain key-value object to the CDK tag format.
   * @param tags A key-value object representing tags
   */
  private convertTagsToCdkFormat(tags?: { [key: string]: string }): cdk.CfnTag[] | undefined {
    if (!tags) {
      return undefined;
    }
    return Object.entries(tags).map(([key, value]) => ({
      key,
      value,
    }));
  }
}
