#!/usr/bin/env ruby
#
# jekyll-seo-tag (confirmed present in both 2.8.0, the version pinned here, and 2.9.0,
# the current latest -- this is an unfixed upstream bug, not a version we can upgrade
# away from) hardcodes the literal string "imageObject" instead of the valid schema.org
# type "ImageObject" in its JSON-LD output, whenever a page's `image:` front matter is a
# hash with more than one key (lib/jekyll-seo-tag/json_ld_drop.rb#image). Every post and
# tab on this site uses the {path, alt, lqip} image hash, so every page hits this branch.
# Patched here with a post-render string fix rather than forking the gem.

Jekyll::Hooks.register [:pages, :posts, :tabs], :post_render do |doc|
  doc.output.sub!('"@type":"imageObject"', '"@type":"ImageObject"') if doc.output.include?('"@type":"imageObject"')
end
