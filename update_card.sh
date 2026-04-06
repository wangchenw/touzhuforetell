#!/bin/bash

FILE="src/pages/Bookkeeping.tsx"

# Change card background and border
sed -i '' 's/className="rounded-3xl bg-white\/70 backdrop-blur-2xl border border-white\/40 shadow-\[0_8px_32px_rgba(0,0,0,0.04)\] p-6 relative overflow-hidden"/className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white\/10 shadow-\[0_12px_40px_rgba(0,0,0,0.15)\] p-6 relative overflow-hidden text-white"/g' $FILE

# Change top labels
sed -i '' 's/text-\[13px\] font-semibold text-gray-600/text-\[13px\] font-semibold text-white\/60/g' $FILE
sed -i '' 's/text-\[14px\] text-gray-600 font-medium tracking-wide/text-\[14px\] text-white\/60 font-medium tracking-wide/g' $FILE

# Change main number (We will inject dynamic color based on profit)
# Instead of text-gray-900, let's use a class that depends on the value. But TextReveal doesn't easily take dynamic color if we just replace the string. Let's make it text-white for now, or text-emerald-400.
# Actually, let's replace the whole TextReveal block.
sed -i '' 's/className="text-\[48px\] font-black tracking-tighter leading-none text-gray-900"/className={`text-[48px] font-black tracking-tighter leading-none ${stats.totalProfit >= 0 ? '"'text-emerald-400'"' : '"'text-rose-400'"'}`}/g' $FILE

# The "元" text next to the main number
sed -i '' 's/text-\[15px\] font-medium text-gray-500 ml-1.5/text-\[15px\] font-medium text-white\/50 ml-1.5/g' $FILE

# Bottom row labels
sed -i '' 's/text-\[14px\] text-gray-600 font-medium tracking-widest/text-\[11px\] text-white\/50 font-medium tracking-widest/g' $FILE

# Bottom row values
sed -i '' 's/text-\[18px\] font-bold text-gray-800/text-\[18px\] font-bold text-white/g' $FILE

# Bottom row units (%, 单, 元)
sed -i '' 's/text-\[13px\] text-gray-500 ml-0.5/text-\[11px\] text-white\/40 ml-0.5/g' $FILE

# Dividers
sed -i '' 's/w-px h-8 bg-gray-200\/40/w-px h-8 bg-white\/10/g' $FILE

# Auras
sed -i '' 's/border border-emerald-500\/\[0.06\]/border border-white\/5/g' $FILE
sed -i '' 's/bg-emerald-400\/\[0.05\]/bg-emerald-500\/10/g' $FILE

