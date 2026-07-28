/*
  Simple seed inserts for ContactId 57.
  Based on src/app/models/contact-detail.model.ts:
  - ContactAddress: contactId, street1, street2, city, county, state, zip, isActive, createdAt, modifiedAt
  - ContactPhone: contactId, number, type, isPrimary, isActive, createdAt, modifiedAt

  Assumes SQL table names:
  - dbo.ContactAddress
  - dbo.ContactPhone
*/

SET NOCOUNT ON;

DECLARE @ContactId INT = 57;
DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

/* 6 address records */
INSERT INTO dbo.ContactAddress
(
  ContactId,
  Street1,
  Street2,
  City,
  County,
  [State],
  Zip,
  IsActive,
  CreatedAt,
  ModifiedAt
)
VALUES
(@ContactId, N'824 Riverbend Ave', N'Suite 3A', N'Austin', N'Travis', N'TX', N'78701', 1, @Now, @Now),
(@ContactId, N'19 Cedar Grove Ln', N'', N'Portland', N'Multnomah', N'OR', N'97205', 1, @Now, @Now),
(@ContactId, N'451 Northlake Dr', N'Floor 2', N'Charlotte', N'Mecklenburg', N'NC', N'28202', 1, @Now, @Now),
(@ContactId, N'77 Magnolia Blvd', N'Unit 12', N'Atlanta', N'Fulton', N'GA', N'30303', 1, @Now, @Now),
(@ContactId, N'300 Summit Ridge Rd', N'', N'Denver', N'Denver', N'CO', N'80202', 1, @Now, @Now),
(@ContactId, N'140 Seaside Pkwy', N'Bldg C', N'San Diego', N'San Diego', N'CA', N'92101', 1, @Now, @Now);

/* 6 phone records */
INSERT INTO dbo.ContactPhone
(
  ContactId,
  [Number],
  [Type],
  IsPrimary,
  IsActive,
  CreatedAt,
  ModifiedAt
)
VALUES
(@ContactId, N'+1 (512) 555-0141', N'Office', 1, 1, @Now, @Now),
(@ContactId, N'+1 (512) 555-0142', N'Mobile', 0, 1, @Now, @Now),
(@ContactId, N'+1 (512) 555-0143', N'Home', 0, 1, @Now, @Now),
(@ContactId, N'+1 (512) 555-0144', N'Billing', 0, 1, @Now, @Now),
(@ContactId, N'+1 (512) 555-0145', N'Support', 0, 1, @Now, @Now),
(@ContactId, N'+1 (512) 555-0146', N'After Hours', 0, 1, @Now, @Now);

SELECT @ContactId AS ContactId, 6 AS InsertedAddressCount, 6 AS InsertedPhoneCount;
