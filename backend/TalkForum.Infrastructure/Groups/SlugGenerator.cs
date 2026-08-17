using System.Text.RegularExpressions;

namespace TalkForum.Infrastructure.Groups;

public static partial class SlugGenerator
{
    public static string Slugify(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        normalized = NonAlphanumericRegex().Replace(normalized, "-");
        normalized = MultipleDashesRegex().Replace(normalized, "-").Trim('-');
        return normalized.Length == 0 ? "group" : normalized;
    }

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NonAlphanumericRegex();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex MultipleDashesRegex();
}
