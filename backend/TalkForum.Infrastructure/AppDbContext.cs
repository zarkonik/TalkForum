using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMembership> GroupMemberships => Set<GroupMembership>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<CommentLike> CommentLikes => Set<CommentLike>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
        });

        builder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(c => c.Slug).IsUnique();

            entity.HasData(
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000001"), Name = "Software", Slug = "software" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000002"), Name = "Business", Slug = "business" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000003"), Name = "Fitness", Slug = "fitness" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000004"), Name = "Music", Slug = "music" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000005"), Name = "Gaming", Slug = "gaming" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000006"), Name = "Art", Slug = "art" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000007"), Name = "Education", Slug = "education" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000008"), Name = "Other", Slug = "other" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000009"), Name = "Health", Slug = "health" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000010"), Name = "Wealth", Slug = "wealth" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000011"), Name = "Hobby", Slug = "hobby" },
                new Category { Id = new Guid("00000000-0000-0000-0000-000000000012"), Name = "Tech", Slug = "tech" }
            );
        });

        builder.Entity<Group>(entity =>
        {
            entity.Property(g => g.Name).HasMaxLength(100).IsRequired();
            entity.Property(g => g.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(g => g.Slug).IsUnique();

            entity.HasOne(g => g.Category)
                .WithMany(c => c.Groups)
                .HasForeignKey(g => g.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(g => g.ParentGroup)
                .WithMany(g => g.SubGroups)
                .HasForeignKey(g => g.ParentGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(g => g.CreatedByUser)
                .WithMany()
                .HasForeignKey(g => g.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<GroupMembership>(entity =>
        {
            entity.HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();

            entity.HasOne(m => m.Group)
                .WithMany(g => g.Memberships)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.DecidedByUser)
                .WithMany()
                .HasForeignKey(m => m.DecidedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Post>(entity =>
        {
            entity.Property(p => p.Title).HasMaxLength(200).IsRequired();

            entity.HasOne(p => p.Group)
                .WithMany(g => g.Posts)
                .HasForeignKey(p => p.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Author)
                .WithMany()
                .HasForeignKey(p => p.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Comment>(entity =>
        {
            entity.HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Author)
                .WithMany()
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PostLike>(entity =>
        {
            entity.HasIndex(l => new { l.PostId, l.UserId }).IsUnique();

            entity.HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CommentLike>(entity =>
        {
            entity.HasIndex(l => new { l.CommentId, l.UserId }).IsUnique();

            entity.HasOne(l => l.Comment)
                .WithMany(c => c.Likes)
                .HasForeignKey(l => l.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasIndex(n => new { n.RecipientUserId, n.IsRead });

            entity.HasOne(n => n.Recipient)
                .WithMany()
                .HasForeignKey(n => n.RecipientUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Actor)
                .WithMany()
                .HasForeignKey(n => n.ActorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(n => n.Group)
                .WithMany()
                .HasForeignKey(n => n.GroupId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(n => n.Post)
                .WithMany()
                .HasForeignKey(n => n.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Comment)
                .WithMany()
                .HasForeignKey(n => n.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Report>(entity =>
        {
            entity.Property(r => r.Reason).HasMaxLength(1000);
            entity.HasIndex(r => r.Status);

            entity.HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.ResolvedByUser)
                .WithMany()
                .HasForeignKey(r => r.ResolvedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Post)
                .WithMany()
                .HasForeignKey(r => r.PostId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.Comment)
                .WithMany()
                .HasForeignKey(r => r.CommentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.Group)
                .WithMany()
                .HasForeignKey(r => r.GroupId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
