using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetShop.Api.Migrations
{
    /// <inheritdoc />
    public partial class CreateUserExternalAccountsAndRemoveProviderFromUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_external_accounts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    provider_key = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    provider_email = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_external_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_external_accounts_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_external_accounts_provider_provider_key",
                table: "user_external_accounts",
                columns: new[] { "provider", "provider_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_external_accounts_user_id_provider",
                table: "user_external_accounts",
                columns: new[] { "user_id", "provider" },
                unique: true);

            // Chuyển đổi dữ liệu tài khoản bên ngoài hiện có (nếu có) trước khi xóa cột
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = N'Provider')
                BEGIN
                    INSERT INTO user_external_accounts (user_id, provider, provider_key, provider_email, created_at)
                    SELECT Id, Provider, ProviderKey, Email, GETUTCDATE()
                    FROM Users
                    WHERE Provider IS NOT NULL AND Provider <> 'Local' AND ProviderKey IS NOT NULL AND ProviderKey <> '';
                END
            ");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProviderKey",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Local");

            migrationBuilder.AddColumn<string>(
                name: "ProviderKey",
                table: "Users",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE u
                SET u.Provider = e.provider, u.ProviderKey = e.provider_key
                FROM Users u
                INNER JOIN user_external_accounts e ON u.Id = e.user_id;
            ");

            migrationBuilder.DropTable(
                name: "user_external_accounts");
        }
    }
}
