<?php

	/**
	 * {{name}}
	 * ===================================================================
	 *
	 *
	 * ===================================================================
	 */


    class {{phpName}}
    {


        /**
         * init
         * ---------------------------------------------------------------------
         * initiate class and expose its methods
         *
         * @return void
         */
        private static function init()
        {

            $class = __CLASS__;
            new $class;

        }






        /**
         * __construct
         * ---------------------------------------------------------------------
         */
        public function __construct()
        {

        }






        /**
         * get_markup
         * -----------------------------------------------------
         * Returns markup for
         *
         * @return    string                                 Promo List list markup
         */
        public static function get_markup(  )
        {

            $HTML = '';


            return $HTML;
        }









        /**
         * the_markup
         * -----------------------------------------------------
         * Echos a markup for
         *
         * @return    string                                 Promo List list markup
         */
        public static function the_markup()
        {
            echo self::get_markup();
        }


    }