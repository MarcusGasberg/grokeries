export const vpc = new sst.aws.Vpc("VPC", {
  bastion: true,
  nat: "managed",
});
