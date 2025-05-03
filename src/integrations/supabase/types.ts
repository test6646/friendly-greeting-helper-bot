export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          postal_code: string
          state: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          postal_code: string
          state: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          postal_code?: string
          state?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      captain_profiles: {
        Row: {
          availability_schedule: Json | null
          average_rating: number | null
          created_at: string | null
          current_location: Json | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          service_areas: Json | null
          total_deliveries: number | null
          updated_at: string | null
          user_id: string
          vehicle_registration: string
          vehicle_type: string
          verification_status: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          average_rating?: number | null
          created_at?: string | null
          current_location?: Json | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          service_areas?: Json | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_registration: string
          vehicle_type: string
          verification_status?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          average_rating?: number | null
          created_at?: string | null
          current_location?: Json | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          service_areas?: Json | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_registration?: string
          vehicle_type?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captain_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          delivery_date: string | null
          id: string
          meal_id: string
          price: number
          quantity: number
          subscription: Json | null
          subtotal: number
          updated_at: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          meal_id: string
          price: number
          quantity?: number
          subscription?: Json | null
          subtotal: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          meal_id?: string
          price?: number
          quantity?: number
          subscription?: Json | null
          subtotal?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string | null
          delivery_fee: number
          id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_fee?: number
          id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_fee?: number
          id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          captain_id: string
          captain_rating: number | null
          created_at: string | null
          customer_rating: number | null
          customer_signature: boolean | null
          delivery_code: string | null
          delivery_fee: number
          delivery_notes: string | null
          delivery_proof_url: string | null
          delivery_time: string | null
          distance: number | null
          id: string
          order_id: string
          pickup_time: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          captain_id: string
          captain_rating?: number | null
          created_at?: string | null
          customer_rating?: number | null
          customer_signature?: boolean | null
          delivery_code?: string | null
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_proof_url?: string | null
          delivery_time?: string | null
          distance?: number | null
          id?: string
          order_id: string
          pickup_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          captain_id?: string
          captain_rating?: number | null
          created_at?: string | null
          customer_rating?: number | null
          customer_signature?: boolean | null
          delivery_code?: string | null
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_proof_url?: string | null
          delivery_time?: string | null
          distance?: number | null
          id?: string
          order_id?: string
          pickup_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_ratings: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ratings_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          available_days: Json | null
          available_quantity: number | null
          category: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          dietary_info: Json | null
          discount_percent: number | null
          id: string
          images: string[] | null
          ingredients: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          max_orders_per_day: number | null
          name: string
          nutritional_info: Json | null
          preparation_time: number | null
          price_monthly: number | null
          price_single: number
          price_weekly: number | null
          rating: number | null
          rating_count: number | null
          seller_id: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          available_days?: Json | null
          available_quantity?: number | null
          category?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_info?: Json | null
          discount_percent?: number | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_orders_per_day?: number | null
          name: string
          nutritional_info?: Json | null
          preparation_time?: number | null
          price_monthly?: number | null
          price_single: number
          price_weekly?: number | null
          rating?: number | null
          rating_count?: number | null
          seller_id: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          available_days?: Json | null
          available_quantity?: number | null
          category?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_info?: Json | null
          discount_percent?: number | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_orders_per_day?: number | null
          name?: string
          nutritional_info?: Json | null
          preparation_time?: number | null
          price_monthly?: number | null
          price_single?: number
          price_weekly?: number | null
          rating?: number | null
          rating_count?: number | null
          seller_id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_entity_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_entity_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_entity_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          order_id: string
          price: number
          quantity: number
          subscription: Json | null
          subtotal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          order_id: string
          price: number
          quantity?: number
          subscription?: Json | null
          subtotal: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          order_id?: string
          price?: number
          quantity?: number
          subscription?: Json | null
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string
          created_at: string
          delivery_fee: number
          id: string
          payment_method_id: string
          payment_status: string
          seller_id: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id: string
          created_at?: string
          delivery_fee?: number
          id?: string
          payment_method_id: string
          payment_status?: string
          seller_id: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          payment_method_id?: string
          payment_status?: string
          seller_id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          profile_image_url: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id: string
          last_name: string
          phone?: string | null
          profile_image_url?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          profile_image_url?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          availability: Json | null
          business_description: string | null
          business_name: string
          commission_rate: number | null
          cover_image_url: string | null
          created_at: string | null
          cuisine_types: string[] | null
          gallery_images: string[] | null
          id: string
          is_active: boolean | null
          is_promoted: boolean | null
          kitchen_open: boolean | null
          rating: number | null
          rating_count: number | null
          service_areas: Json | null
          social_media: Json | null
          special_diets: string[] | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          availability?: Json | null
          business_description?: string | null
          business_name: string
          commission_rate?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine_types?: string[] | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_promoted?: boolean | null
          kitchen_open?: boolean | null
          rating?: number | null
          rating_count?: number | null
          service_areas?: Json | null
          social_media?: Json | null
          special_diets?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          availability?: Json | null
          business_description?: string | null
          business_name?: string
          commission_rate?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine_types?: string[] | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_promoted?: boolean | null
          kitchen_open?: boolean | null
          rating?: number | null
          rating_count?: number | null
          service_areas?: Json | null
          social_media?: Json | null
          special_diets?: string[] | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_verifications: {
        Row: {
          address_proof_url: string | null
          business_certificate_url: string | null
          created_at: string | null
          id: string
          id_proof_url: string | null
          other_documents: Json | null
          selfie_with_id_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          address_proof_url?: string | null
          business_certificate_url?: string | null
          created_at?: string | null
          id?: string
          id_proof_url?: string | null
          other_documents?: Json | null
          selfie_with_id_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          address_proof_url?: string | null
          business_certificate_url?: string | null
          created_at?: string | null
          id?: string
          id_proof_url?: string | null
          other_documents?: Json | null
          selfie_with_id_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
