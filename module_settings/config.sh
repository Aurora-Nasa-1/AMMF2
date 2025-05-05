#!/system/bin/sh
if [ -f build_config.sh  ]; then
. build_config.sh
elif [ -f module_settings/build_config.sh  ]; then
. module_settings/build_config.sh
elif [ -f $MODPATH/module_settings/build_config.sh  ]; then
. $MODPATH/module_settings/build_config.sh
fi

print_languages="en"                   # Default language for printing